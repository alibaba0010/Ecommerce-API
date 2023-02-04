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
  httpGetSpecificProduct,
  httpGetAllCarts,
} from "../controller/cart.controller.js";

cartRouter
  .route("/cart")
  .post(authenticateUser, verifyUser, httpCreateCart)
  .get(authenticateUser, verifyAdmin, httpGetAllCarts);
cartRouter
  .route("/cart/:id")
  .patch(authenticateUser, verifyUser, httpUpdateCart)
  .delete(authenticateUser, verifyAdmin, httpDeleteCart)
  .get(authenticateUser, verifyUser, httpGetCart);

cartRouter
  .route("/cart/:cartId/:productId")
  .get(authenticateUser, verifyUser, httpGetSpecificProduct);

export default cartRouter;
