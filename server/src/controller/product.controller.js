import { StatusCodes } from "http-status-codes";
import notFoundError from "../errors/notFound.js";
import Product from "../model/product/product.mongo.js";
import { getPagination } from "../services/query.js";
import multer from "multer";

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cd(null, "/uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString() + file.originalname);
//   },
// });
// const upload = multer({ dest: "/uploads/" });

// const fileFilter = (req, file, cb) => {
//   // reject a file type
//   if (file.mimetype === image / png || file.mimetype === image / jpg) {
//     cb("Success", true);
//   } else {
//     cb(new Error("Add a jpg or png image"), false);
//   }
// };

// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 1024 * 1024 * 10,
//   },
// fileFilter
// });

export const uploadImage = (req, res, next) => {
  upload.single("images");
  console.log("Body: ", req.body);
  console.log("Files: ", req.files);
  next();
};

// CREATE PRODUCT
export async function httpAddNewProduct(req, res) {
  console.log("Req: ", req.body);

  const addProduct = req.body;
  // addProduct.images = req.file.path;
  const product = await Product.create(addProduct);
  res.status(StatusCodes.CREATED).json(product);
}

// UPDATE PRODUCT
export async function httpUpdateProduct(req, res) {
  const productId = req.params.id;
  const product = req.body;
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

// const { categories, size, price, fields, nFilters } = req.query;
// // const { featured, company, name, sort, fields, nFilters } = req.query;
// const queryObject = {};

// if (featured) {
//   queryObject.featured = featured === "true" ? true : false;
// }

// if (company) {
//   queryObject.company = company;
// }
// if (name) {
//   queryObject.name = { $regex: name, $options: "i" };
// }
// if (nFilters) {
//   const operatorMap = {
//     ">": "$gt",
//     ">=": "$gte",
//     "=": "$eq",
//     "<": "$lt",
//     "<=": "$lte",
//   };
//   const regEx = /\b(<|>|>=|=|<|<=)\b/g;
//   let filters = nFilters.replace(regEx, (match) => `-${operatorMap[match]}-`);

//   const options = ["price", "rating"];

//   filters = filters.split(",").forEach((item) => {
//     const [field, operator, value] = item.split("-");
//     if (options.includes(field)) {
//       queryObject[field] = { [operator]: Number(value) };
//     }
//   });
// }
// console.log(queryObject);
// let result = Product.find(queryObject);

// // sort
// if (sort) {
//   const sortList = sort.split(",").join(" ");
//   result = result.sort(sortList);
// } else {
//   result = result.sort("createdAt");
// }
// if (fields) {
//   const fieldsList = fields.split(",").join(" ");
//   result = result.select(fieldsList);
// }

// const { skip, limit } = getPagination(req.query);
// result = result.skip(skip).limit(limit);

// const productQuery = await result;
// return res.status(200).json({ productQuery, bits: productQuery.length });
