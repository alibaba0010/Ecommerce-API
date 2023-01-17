import { Router } from "express";
import {
  httpAddNewUser,
  httpAddNewAdmin,
  httpLogin,
  // updateUser,
  getAllUserByAdmin,
  getUserByAdmin,
  showCurrentUser,
  // updatePassword,
} from "../controller/user.controller.js";

import {
  authenticateUser,
  verifyAdmin,
  verifyAdminWithId,
  verifyUserWithId,
} from "../middleware/auth.js";

const userRouter = Router();
userRouter
  .post("/users/register", httpAddNewUser)
  .post("/admin/register", httpAddNewAdmin)
  .post("/users/login", httpLogin)
  // .patch("/users/:id", authenticateUser, verifyUser, updateUser)
  // .patch("/password", updatePassword)
  .get("/users", authenticateUser, verifyAdminWithId, getAllUserByAdmin)
  .get("/user/:id", authenticateUser, verifyAdminWithId, getUserByAdmin)
  .get("/user", authenticateUser, verifyUserWithId, showCurrentUser);

export default userRouter;
