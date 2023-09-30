import { v2 as cloudinary } from "cloudinary";
import { StatusCodes } from "http-status-codes";
import notFoundError from "../errors/notFound.js";
import Product from "../model/product/product.mongo.js";
import { getPagination } from "../services/query.js";
import User from "../model/user/user.mongo.js";
import BadRequestError from "../errors/badRequest.js";
import UnAuthorizedError from "../errors/unauthorized.js";
import { checkAdmin } from "../model/user/user.model.js";
import { addImage, productUser } from "../model/product/product.model.js";

// Configuration
export default cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// CREATE PRODUCT
export async function httpAddNewProduct(req, res) {
  const { userId } = req.user;
  const { file } = req;

  const { title, desc, categories, color, size, price, quantity } = req.body;

  await checkAdmin(userId);

  if (!title || !desc || !size || !price)
    throw new BadRequestError("Please fill all required field");

  if (!file) throw new BadRequestError("Please provide an image");

  const fileData = await addImage(file);
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
  const { file } = req;
  await checkAdmin(userId);

  await productUser(productId);

  // Handle Imageupload
  let fileData = {};
  let image;
  if (!file) image = findProduct.image;

  const updatedProduct = {
    title,
    desc,
    categories,
    color,
    size,
    price,
    quantity,
    image: Object.keys(fileData).length === 0 ? image : fileData,
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

  await checkAdmin(userId);
  await productUser(productId);

  const product = await Product.findById(productId);

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
  const { title, color, categories, size, sort, fields, numericFilters } =
    req.query; // price check in postman
  const queryObject = {};

  if (color) queryObject.color = color;
  if (size) queryObject.size = size;
  if (title) queryObject.title = { $regex: title, $options: "i" };
  if (numericFilters) {
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };
    const regEx = /\b(<|>|>=|=|<|<=)\b/g;
    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`
    );

    const options = ["price"]; //numericFilters
    filters = filters.split(",").forEach((item) => {
      const [field, operator, value] = item.split("-");
      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number(value) };
      }
    });
  }
  let result = Product.find(queryObject);

  // sort
  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("createdAt");
  }

  //FIELDS
  if (fields) {
    const fieldsList = fields.split(",").join(" ");
    result = result.select(fieldsList);
  }
  const { skip, limit } = getPagination(req.query);
  result = result.skip(skip).limit(limit);

  const productQuery = await result;
  return res.status(200).json({ productQuery, bits: productQuery.length });
}
