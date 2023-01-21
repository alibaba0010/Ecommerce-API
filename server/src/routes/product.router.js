import { Router } from "express";
import {
  httpAddNewProduct,
  httpUpdateProduct,
  httpDeleteProduct,
  httpGetProduct,
  httpGetAllProducts,
} from "../controller/product.controller.js";

import { authenticateUser, verifyAdmin } from "../middleware/auth.js";

const productRouter = Router();

productRouter
  .route("/")
  .post(authenticateUser, verifyAdmin, httpAddNewProduct)
  .get(httpGetAllProducts);
productRouter
  .route("/:id")
  .patch(authenticateUser, verifyAdmin, httpUpdateProduct)
  .delete(authenticateUser, verifyAdmin, httpDeleteProduct)
  .get(httpGetProduct);

export default productRouter;
