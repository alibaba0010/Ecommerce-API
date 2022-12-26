import { Router } from "express";
import {
  httpAddNewUser,
  httpAddNewAdmin,
  httpLogin,
  // updateUser,
  getAllUserByAdmin,
  getUserByAdmin,
  // updatePassword,
} from "../controller/user.controller.js";

import {
  authenticateUser,
  verifyAdmin,
  verifyAdminWithId,
} from "../middleware/auth.js";

const userRouter = Router();
userRouter
  .post("/users/register", httpAddNewUser)
  .post("/admin/register", httpAddNewAdmin)
  .post("/users/login", httpLogin)
  // .patch("/users/:id", authenticateUser, verifyUser, updateUser)
  // .patch("/password", updatePassword)
  .get("/users", authenticateUser, verifyAdminWithId, getAllUserByAdmin)
  .get("/user/:id", authenticateUser, verifyAdmin, getUserByAdmin);

export default userRouter;
