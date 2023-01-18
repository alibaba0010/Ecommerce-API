import { Router } from "express";
import {
  httpAddNewUser,
  httpAddNewAdmin,
  httpLogin,
  updateUser,
  getAllUserByAdmin,
  getUserByAdmin,
  showCurrentUser,
  updateUserPassword,
  logOutUser,
} from "../controller/user.controller.js";

import {
  authenticateUser,
  verifyAdmin,
  verifyAdminWithId,
  verifyUser,
} from "../middleware/auth.js";

const userRouter = Router();
userRouter
  .post("/users/register", httpAddNewUser)
  .post("/admin/register", httpAddNewAdmin)
  .post("/users/login", httpLogin)
  //update user already  logged in with his token verification
  .patch("/users/user", authenticateUser, verifyUser, updateUser)
  .patch("/password",authenticateUser, verifyUser, updateUserPassword)
  .get("/users", authenticateUser, verifyAdmin, getAllUserByAdmin)
  //verify if user is admin before getting the user by the id params
  .get("/user/:id", authenticateUser, verifyAdmin, getUserByAdmin)
  .get("/user", authenticateUser, verifyUser, showCurrentUser)
  .get("/users/logout", authenticateUser, verifyUser, logOutUser);

export default userRouter;
