import { Router } from "express";
import {
  httpAddNewProduct,
  httpUpdateProduct,
  httpDeleteProduct,
  httpGetProduct,
  httpGetAllProducts,
  getAllProducts,
} from "../controller/product.controller.js";

import { authenticateUser, verifyAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/uploadImage.js";

const productRouter = Router();

productRouter
  .route("/")
  .post(
    authenticateUser,
    verifyAdmin,
    upload.single("image"),
    httpAddNewProduct
  )
  .get(httpGetAllProducts); // getAllProducts
productRouter
  .route("/:id")
  .patch(
    authenticateUser,
    verifyAdmin,
    upload.single("image"),
    httpUpdateProduct
  )
  .delete(authenticateUser, verifyAdmin, httpDeleteProduct)
  .get(httpGetProduct);

export default productRouter;
