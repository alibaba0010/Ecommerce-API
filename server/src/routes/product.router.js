import { Router } from "express";
import {
  httpAddNewProduct,
  httpUpdateProduct,
  httpDeleteProduct,
  httpGetProduct,
  httpGetAllProducts,
} from "../controller/product.controller.js";

import {
  authenticateUser,
  verifyAdmin,
  verifyAdminWithId,
} from "../middleware/auth.js";

const productRouter = Router();

productRouter
  .route("/")
  .post(authenticateUser, verifyAdmin, httpAddNewProduct)
  .get(httpGetAllProducts);
productRouter
  .route("/:id")
  .patch(authenticateUser, verifyAdminWithId, httpUpdateProduct)
  .delete(authenticateUser, verifyAdminWithId, httpDeleteProduct)
  .get(httpGetProduct);

export default productRouter;
