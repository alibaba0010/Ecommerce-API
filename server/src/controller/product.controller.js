import { v2 as cloudinary } from "cloudinary";
import { StatusCodes } from "http-status-codes";
import notFoundError from "../errors/notFound.js";
import Product from "../model/product.mongo.js";
import { getPagination } from "../services/query.js";
import User from "../model/user.mongo.js";
import { fileSizeFormatter } from "../services/uploadImage.js";
import BadRequestError from "../errors/badRequest.js";
import UnAuthorizedError from "../errors/unauthorized.js";
// Configuration
export default cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// CREATE PRODUCT
export async function httpAddNewProduct(req, res) {
  const { userId } = req.user;
  const { title, desc, categories, color, size, price, quantity } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Unable to get user");

  if (!title || !desc || !size || !price)
    throw new BadRequestError("Please fill all required field");

  // Handle Imageupload
  let fileData = {};

  if (req.file) {
    // Save image to cloudinary
    const uploadedFile = await cloudinary.uploader.upload(req.file.path, {
      folder: "Ecommerce API",
      resource_type: "image",
    });
    fileData = {
      id: uploadedFile.public_id,
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  } else {
    throw new BadRequestError("Please provide an image");
  }
  const product = await Product.create({
    user: userId,
    title,
    desc,
    categories,
    color,
    size,
    price,
    quantity,
    image: fileData,
  });
  const { __v, ...others } = product._doc;

  res.status(StatusCodes.CREATED).json(others);
}

// UPDATE PRODUCT
export async function httpUpdateProduct(req, res) {
  const { userId } = req.user;
  const { id: productId } = req.params;
  const { title, desc, categories, color, size, price, quantity } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new notFoundError("User not Found");

  const findProduct = await Product.findById(productId);
  if (!findProduct) throw new notFoundError("Product not Found");

  // Match product to its user
  if (findProduct.user.toString() !== userId) {
    throw new UnAuthorizedError("Unauthorized User");
  }

  // Handle Imageupload
  let fileData = {};
  let image;
  // Save image to cloudinary
  if (req.file) {
    const uploadedFile = await cloudinary.uploader.upload(req.file.path, {
      folder: "Ecommerce API",
      resource_type: "image",
    });
    fileData = {
      id: uploadedFile.public_id,
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  } else {
    image = findProduct.image;
  }
  const updatedProduct = {
    title,
    desc,
    categories,
    color,
    size,
    price,
    quantity,
    image,
  };
  const updateProduct = await Product.findByIdAndUpdate(
    { _id: productId },
    { $set: updatedProduct },
    { new: true, runValidators: true }
  );
  if (!updateProduct)
    throw new notFoundError(`Unable to update product with ${productId}`);
  const { __v, ...others } = updateProduct._doc;

  res.status(StatusCodes.OK).json(others);
}

// DELETE PRODUCT
export async function httpDeleteProduct(req, res) {
  const { id: productId } = req.params;
  const { userId } = req.user;
  const product = await Product.findById(productId);
  if (!product)
    throw new notFoundError(`Unable to get product with id ${productId}`);

  console.log("Product User: ", product.user);
  // Match product to its user
  if (product.user.toString() !== userId)
    throw new UnAuthorizedError("Unauthorized User");

  await product.remove();
  return res.status(StatusCodes.OK).json({
    msg: `${productId} deleted`,
  });
}

// GET A SPECIFIC PRODUCT
export async function httpGetProduct(req, res) {
  const { id: productId } = req.params;
  const product = await Product.findById(productId);
  if (!product)
    throw new notFoundError(`Unable to get product with id ${productId}`);

  return await res.status(StatusCodes.OK).json({
    product,
    request: {
      type: "GET",
      url: `http://localhost:2000/v1/products/${product._id}`,
    },
  });
}

// GET ALL PRODUCTS
export async function httpGetAllProducts(req, res) {
  const { skip, limit } = getPagination(req.query);
  const products = await Product.find({}, { _id: 0, __v: 0 })
    .sort("createdAt")
    .skip(skip)
    .limit(limit);
  if (!products) throw new notFoundError("Unable to get products");
  return await res.status(StatusCodes.OK).json({
    products,
    request: { type: "POST", url: "http://localhost:2000/v1/products" },
  });
}
async function getProducts(req, res) {
  const { title, color, categories, size, nFilters } = req.query; // price check in postman
  const queryObject = {};

  if (color) queryObject.color = color;

  if (title) queryObject.title = { $regex: title, $options: "i" };
  if (nFilters) {
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };
    const regEx = /\b(<|>|>=|=|<|<=)\b/g;
    let filters = nFilters.replace(regEx, (match) => `-${operatorMap[match]}-`);

    const options = ["price", "rating"];
    console.log("options: ", options);
    filters = filters.split(",").forEach((item) => {
      const [field, operator, value] = item.split("-");
      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number(value) };
      }
    });
  }
  console.log(queryObject);
  let result = Product.find(queryObject);
  console.log("results: ", result);

  const { skip, limit } = getPagination(req.query);
  result = result.skip(skip).limit(limit);

  const productQuery = await result;
  console.log("ProductQuery: ", productQuery);
  return res.status(200).json({ productQuery, bits: productQuery.length });
}
