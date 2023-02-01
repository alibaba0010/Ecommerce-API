import Cart from "../model/cart.mongo.js";
import notFoundError from "../errors/notFound.js";

import { StatusCodes } from "http-status-codes";
import Product from "../model/product.mongo.js";
import { getPagination } from "../services/query.js";
import BadRequestError from "../errors/badRequest.js";

// CREATE CART
export async function httpCreateCart(req, res) {
  const { userId } = req.user;
  if (!userId) throw new notFoundError("Login to add Product to cart");

  const { products } = req.body;

  const ProductId = products.map((product) => product.productId);
  
  console.log("p", ProductId.toString());
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

  const ProductId = products.map((product) => product.productId);
  const checkProduct = await Product.findById(ProductId.toString());

  if (!checkProduct) throw new notFoundError("Unable to get Product to cart");

  const cart = await Cart.findById(cartId);
  if (!cart) throw new notFoundError("Unable to get cart");

  if (!products)
    throw new BadRequestError("Please provide products to add to cart");

  cart.products = products;
  const updateCart = await cart.save();

  const { __v, ...others } = updateCart._doc;

  return res.status(StatusCodes.OK).json(others);
}

// DELETE CART
export async function httpDeleteCart(req, res) {
  const { id: cartId } = req.params;
  const { userId } = req.user;

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

// GET A SPECIFIC CART
export async function httpGetCart(req, res) {
  const { id: cartId } = req.params;
  const { userId } = req.user;

  const cart = await Cart.findById(cartId);
  if (!cart) throw new notFoundError(`Unable to get product with id ${cartId}`);

  // Match product to its user
  if (cart.user.toString() !== userId)
    throw new UnAuthorizedError("Unauthorized User");

  return await res.status(StatusCodes.OK).json({
    cart,
    request: {
      type: "GET",
      url: `http://localhost:2000/v1/products/${cart._id}`,
    },
  });
}

// GET ALL CARTS
export async function httpGetAllCarts(req, res) {
  const { userId } = req.user;

  const { skip, limit } = getPagination();
  const cartUser = await Cart.findById(userId);
  // Match product to its user
  if (!cartUser) throw new UnAuthorizedError("Unauthorized User");

  const carts = await Cart.find({}, { _id: 0, __v: 0 })
    .sort({ id: 1 })
    .skip(skip)
    .limit(limit);
  return await res.status(200).json(carts);
}
