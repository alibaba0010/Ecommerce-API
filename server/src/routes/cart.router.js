import { Router } from "express";

import {
  authenticateUser,
  verifyUser,
  verifyAdmin,
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
  .post(authenticateUser, verifyUser, httpCreateCart)
  .patch(authenticateUser, verifyUser, httpUpdateCart)
  .get(authenticateUser, verifyUser, httpGetAllCarts);
cartRouter
  .route("/cart/:id")
  .delete(authenticateUser, verifyAdmin, httpDeleteCart)
  .get(authenticateUser, verifyUser, httpGetCart);

export default cartRouter;
