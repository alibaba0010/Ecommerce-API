import Cart from "../model/cart.mongo.js";
import notFoundError from "../errors/notFound.js";
import UnAuthorizedError from "../errors/unauthorized.js";
import { StatusCodes } from "http-status-codes";
import Product from "../model/product.mongo.js";
import { getPagination } from "../services/query.js";
import BadRequestError from "../errors/badRequest.js";
import User from "../model/user.mongo.js";

// CREATE CART
export async function httpCreateCart(req, res) {
  const { userId } = req.user;
  if (!userId) throw new notFoundError("Login to add Product to cart");

  const { products } = req.body;

  const ProductId = products.map((product) => product.productId);

  const checkProduct = await Product.findById(ProductId.toString());

  if (!checkProduct) throw new notFoundError("Unable to add Product to cart");

  const carts = await Cart.create({ user: userId, products });

  const { __v, ...others } = carts._doc;

  return res.status(StatusCodes.CREATED).json(others);
}

// UPDATE CART
export async function httpUpdateCart(req, res) {
  const { id: cartId } = req.params;
  const { products } = req.body;
  const { productId } = products;
  const checkProduct = await Product.findById(productId);

  if (!checkProduct) throw new notFoundError("Unable to get Product to cart");

  const cart = await Cart.findById(cartId);
  if (!cart) throw new notFoundError("Unable to get cart");
  if (!products)
    throw new BadRequestError("Please provide products to add to cart");

  cart.products.push(products);
  cart.save();

  const { __v, ...others } = cart._doc;

  return res.status(StatusCodes.OK).json(others);
}

// DELETE CART
export async function httpDeleteCart(req, res) {
  const { id: cartId } = req.params;
  const { userId } = req.user;

  const user = await User.findById(userId);

  if (user.isAdmin !== true)
    throw new UnAuthorizedError("Only admin is ascessible");

  const cart = await Cart.findById(cartId);
  if (!cart) throw new notFoundError(`Unable to get cart with id ${cartId}`);

  // Match product to its user
  if (cart.user.toString() !== userId)
    throw new UnAuthorizedError("Unauthorized User");

  // await Cart.findByIdAndDelete(cartId);
  await cart.remove();

  return res.status(StatusCodes.OK).json({
    msg: `${cartId} deleted`,
  });
}

// GET A SPECIFIC CART WITH ALL THE PRODUCTS
export async function httpGetCart(req, res) {
  const { id: cartId } = req.params;
  const { userId } = req.user;
  const { skip, limit } = getPagination(req.query);

  const cart = await Cart.findById(cartId)
    .sort("createdAt")
    .skip(skip)
    .limit(limit);
  if (!cart) throw new notFoundError(`Unable to get cart with id ${cartId}`);

  // Match product to its user
  if (cart.user.toString() !== userId)
    throw new UnAuthorizedError("Unauthorized User");

  return await res.status(StatusCodes.OK).json({
    cart,
    request: {
      type: "GET",
      url: `http://localhost:2000/v1/cart/${cart._id}`,
    },
  });
}

// GET A SPECIFIC PRODUCT FROM A CART
export const httpGetSpecificProduct = async (req, res) => {
  const { cartId, productId } = req.params;
  const { userId } = req.user;

  const cart = await Cart.findById(cartId);
  if (!cart) throw new notFoundError(`Unable to get cart with id ${cartId}`);
  // Match product to its user
  if (cart.user.toString() !== userId)
    throw new UnAuthorizedError("Unauthorized User");

  const ProductId = cart.products.map((product) => product.productId);

  if (ProductId.toString() !== productId)
    throw new notFoundError("Unable to find Product");

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
};

// GET ALL CARTS BY ADMIN
export const httpGetAllCarts = async (req, res) => {
  const { skip, limit } = getPagination(req.query);
  const { userId } = req.user;

  const user = await User.findById(userId);

  if (user.isAdmin !== true)
    throw new UnAuthorizedError("Only admin is ascessible");

  const carts = await Cart.find({}, { __v: 0 })
    .sort("createdAt")
    .skip(skip)
    .limit(limit);
  if (!carts) throw new notFoundError("Unable to get products");
  return await res.status(StatusCodes.OK).json({
    carts,
    request: { type: "GET", url: "http://localhost:2000/v1/cart" },
  });
};
