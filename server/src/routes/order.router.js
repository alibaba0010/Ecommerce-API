import { Router } from "express";

import {
  authenticateUser,
  verifyAdmin,
  verifyUser,
} from "../middleware/auth.js";

const orderRouter = Router();

import {
  httpCreateOrder,
  httpUpdateOrder,
  httpDeleteOrder,
  httpGetOrder,
  httpGetAllOrders,
  httpGetIncome,

} from "../controller/order.controller.js";

orderRouter
  .route("/order")
  .post(authenticateUser, verifyUser, httpCreateOrder)
  .get(authenticateUser, verifyAdmin, httpGetAllOrders);
orderRouter
  .route("/order/:id")
  .patch(authenticateUser, verifyAdmin, httpUpdateOrder)
  .delete(authenticateUser, verifyAdmin, httpDeleteOrder)
  .get(authenticateUser, verifyUser, httpGetOrder);
orderRouter.get("/income", authenticateUser, verifyAdmin, httpGetIncome);
export default orderRouter;
