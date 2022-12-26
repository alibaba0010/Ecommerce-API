import Cart from "../model/cart/cart.mongo.js";

import { StatusCodes } from "http-status-codes";

import { getPagination } from "../services/query.js";

// CREATE CART
export async function httpCreateCart(req, res) {
  req.body.userId = req.user.userId;
  const carts = await Cart.create(req.body);

  return res.status(StatusCodes.CREATED).json({ carts });
}

// UPDATE CART
export async function httpUpdateCart(req, res) {
  const cartId = req.params.id;
  const cart = req.body;
  const updateCart = await Cart.findByIdAndUpdate(
    cartId,
    { $set: cart },
    { new: true }
  );
  return res.status(204).json(updateCart);
}

// DELETE CART
export async function httpDeleteCart(req, res) {
  const cartId = req.params.id;
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
