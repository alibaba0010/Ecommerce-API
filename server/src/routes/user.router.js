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
  forgotPassword,
  resetPassword,
  httpGetUsersStats,
  httpAddAddress,
  httpUpdateAddress,
  generateOtp,
} from "../controller/user.controller.js";

import {
  authenticateUser,
  verifyAdmin,
  verifyUser,
} from "../middleware/auth.js";

const userRouter = Router();
userRouter
  // @desc Register User
  // @route POST /api/v1/users/register
  // @access Public
  .post("/users/register", httpAddNewUser)
  .post("/admin/register", httpAddNewAdmin)
  .post("/users/login", httpLogin)
  .get("/user/generate-otp", generateOtp)
  //update user already  logged in with his token verification
  .patch("/users/user", authenticateUser, verifyUser, updateUser)
  .patch("/user/password", authenticateUser, verifyUser, updateUserPassword)
  .get("/users", authenticateUser, verifyAdmin, getAllUserByAdmin)
  //verify if user is admin before getting the user by the id params
  .get("/user/:id", authenticateUser, verifyAdmin, getUserByAdmin)
  .get("/user", authenticateUser, verifyUser, showCurrentUser)

  .get("/users/stats", authenticateUser, verifyAdmin, httpGetUsersStats)
  .get("/users/logout", authenticateUser, verifyUser, logOutUser)
  .patch("/forgotpassword", forgotPassword)
  .patch("/resetpassword/:resetToken", resetPassword)
  .post("/user/address", authenticateUser, verifyUser, httpAddAddress)
  .patch("/user/address", authenticateUser, verifyUser, httpUpdateAddress);

export default userRouter;
