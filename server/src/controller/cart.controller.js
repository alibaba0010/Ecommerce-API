import Cart from "../model/cart.mongo.js";
import notFoundError from "../errors/notFound.js";

import { StatusCodes } from "http-status-codes";

import { getPagination } from "../services/query.js";
import BadRequestError from "../errors/badRequest.js";

// CREATE CART
export async function httpCreateCart(req, res) {
  const { userId } = req.user;
  if (!userId) throw new notFoundError("Login to add Product to cart");

  const { products } = req.body;
  const carts = await Cart.create({ user: userId, products });

  const { __v, ...others } = carts._doc;

  return res.status(StatusCodes.CREATED).json({ others });
}

// UPDATE CART
export async function httpUpdateCart(req, res) {
  const { id: cartId } = req.params;
  const { products } = req.body;

  const cart = await Cart.findById(cartId);
  if (!cart) throw new notFoundError("Unable to get cart");
  if (!products) throw new BadRequestError("Please provide products");
  cart.products = products;
  const updateCart = await cart.save();

  const { __v, ...others } = updateCart._doc;

  return res.status(204).json(others);
}

// DELETE CART
export async function httpDeleteCart(req, res) {
  const { id: cartId } = req.params;
  await Cart.findByIdAndDelete(cartId);
  if (!cartId) {
    return res.status(404).json({
      err: "Product not found",
    });
  }
  return res.status(200).json({
    msg: `${cartId} deleted`,
  });
}

// GET A SPECIFIC CART
export async function httpGetCart(req, res) {
  const carttId = req.params.id;
  const cart = await Cart.findById(carttId);
  if (cart.isAdmin === true) {
    return await res.status(200).json(cart);
  }
  return res.status(404).json({
    err: "Only admin is ascessible",
  });
}

// GET ALL CARTS
export async function httpGetAllCarts(req, res) {
  const { skip, limit } = getPagination();
  const carts = await Cart.find({}, { _id: 0, __v: 0 })
    .sort({ id: 1 })
    .skip(skip)
    .limit(limit);
  return await res.status(200).json(carts);
}
