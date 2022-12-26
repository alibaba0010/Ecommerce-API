import { Router } from "express";

import {
  authenticateUser,
 verifyAdminWithId,
  verifyUserWithId,
} from "../middleware/auth.js";

const cartRouter = Router();

import {
  httpCreateCart,
  httpUpdateCart,
  httpDeleteCart,
  httpGetCart,
  httpGetAllCarts,
} from "../controller/cart.controller.js";

cartRouter
  .route("/cart")
  .post(authenticateUser, verifyUserWithId, httpCreateCart)
  .patch(authenticateUser, verifyUserWithId, httpUpdateCart)
  .get(authenticateUser, verifyUserWithId, httpGetAllCarts);
cartRouter
  .route("/cart/:id")
  .delete(authenticateUser, verifyAdminWithId, httpDeleteCart)
  .get(authenticateUser, verifyUserWithId, httpGetCart);

export default cartRouter;
