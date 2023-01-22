import { StatusCodes } from "http-status-codes";
import notFoundError from "../errors/notFound.js";
import Product from "../model/product.mongo.js";
import { getPagination } from "../services/query.js";
import User from "../model/user.mongo.js";
// CREATE PRODUCT
export async function httpAddNewProduct(req, res) {
  const { userId } = req.user;
  const { title, desc, categories, color, size, price } = req.body; // add image

  if (!title || !desc || !size || !price)
    throw new BadRequestError("Please fill all required field");
  const product = await Product.create({
    user: userId,
    title,
    desc,
    categories,
    color,
    size,
    price,
  });
  const { __v, ...others } = product._doc;

  res.status(StatusCodes.CREATED).json(others);
}

// UPDATE PRODUCT
export async function httpUpdateProduct(req, res) {
  const { userId } = req.user;
  const productId = req.params.id;
  const { title, desc, categories, color, size, price } = req.body;

  const user = await User.findById(userId);
  if (!user) throw new notFoundError("User not Found");

  const updateProduct = await Product.findByIdAndUpdate(
    { _id: productId },
    { $set: product },
    { new: true }
  );
  if (!updateProduct) throw new notFoundError(`No product with id ${userId}`);

  return res.status(StatusCodes.OK).json(updateProduct);
}

// DELETE PRODUCT
export async function httpDeleteProduct(req, res) {
  const productId = req.params.id;
  const product = await Product.findByIdAndDelete(productId);
  if (!product)
    throw new notFoundError(`Unable to get product with id ${productId}`);

  return res.status(StatusCodes.OK).json({
    msg: `${productId} deleted`,
  });
}

// GET A SPECIFIC PRODUCT
export async function httpGetProduct(req, res) {
  const productId = req.params.id;
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
