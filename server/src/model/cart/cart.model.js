import notFoundError from "../../errors/notFound.js";
import UnAuthorizedError from "../../errors/unauthorized.js";

import User from "../user/user.mongo.js";
import Cart from "./cart.mongo.js";



export const getUser = async (cartId) => {
  const cart = await Cart.findById(cartId);
  if (!cart) throw new notFoundError(`Unable to get cart with id ${cartId}`);

  // Match product to its user
  if (cart.user.toString() !== userId)
    throw new UnAuthorizedError("Unauthorized User");
};
