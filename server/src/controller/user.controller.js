import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import User from "../model/user/user.mongo.js";
import BadRequestError from "../errors/badRequest.js";
import UnAuthenticatedError from "../errors/unaunthenticated.js";
import notFoundError from "../errors/notFound.js";
import { getPagination } from "../services/query.js";
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "redis";
const redisClient = createClient({ url: process.env.REDIS_URI });

// ADD NEW USER
export async function httpAddNewUser(req, res) {
  const { username, email, password } = req.body;
  const user = await User.create({ username, email, password });
  res
    .status(StatusCodes.CREATED)
    .json({ username: user.username, email: user.email, id: user._id });
}

// FOR ADMIN
export async function httpAddNewAdmin(req, res) {
  const admin = req.body;

  admin.isAdmin = true;
  const { username, email, password } = admin;
  const user = await User.create({ username, email, password });

  res
    .status(StatusCodes.CREATED)
    .json({ username: user.username, email: user.email, id: user._id });
}

// LOGIN
export async function httpLogin(req, res) {
  const { username, password } = req.body;

  if (!username || !password)
    throw new BadRequestError("Provide a username and password");

  const checkUsers = await User.findOne({ username });

  if (!checkUsers) throw new UnAuthenticatedError("Invalid Credentials");

  const checkPassword = await checkUsers.comparePassword(password);
  if (!checkPassword) throw new UnAuthenticatedError("Invalid Password");

  const token = await checkUsers.createJWT();

  res
    .status(StatusCodes.OK)
    .json({ id: checkUsers.id, username: checkUsers.username, token });
}

// UPDATE USER
// export async function updateUser(req, res) {
//   const check = req.body;
//   const userId = req.params.id;

//   if (check.username === "")
//     throw new BadRequestError("Username field cannot be empty");

//   const updatedUser = await User.findOneAndUpdate(
//     { _id: userId },
//     { $set: check },
//     { new: true }
//   );
//   if (!updatedUser) throw new notFoundError(`No job with id ${userId}`);

//   const seepass = await updatedUser.save();

//   res.status(StatusCodes.OK).json({
//     username: updatedUser.username,
//     email: updatedUser.email,
//     id: updatedUser._id,
//   });
// }

// GET ALL USERS
export async function getAllUserByAdmin(req, res) {
  const { skip, limit } = getPagination(req.query);
  const users = await User.find({}, { __v: 0, password: 0 })
    .sort("createdAt")
    .skip(skip)
    .limit(limit);

  if (!users) throw new notFoundError("Unable to get Users");

  return res.status(StatusCodes.OK).json({ users, nbHits: users.length });
}

// Get a user by admin
export async function getUserByAdmin(req, res) {
  const userId = req.params.id;
  const user = await User.findById(userId);
  if (!user) throw new notFoundError(`Unable to get User ${userId}`);
  const { password, _id, __v, ...others } = user._doc;
  res.status(StatusCodes.OK).json(others);
}
// Hasn't been used
export const showCurrentUser = async (req, res) => {
  const { userId } = req.user;
  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Unable to get User");

  const { username, id, email, isAdmin } = user;

  return res.status(StatusCodes.OK).json({ username, id, email, isAdmin });
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new BadRequestError("Please provide both values");
  }
  const user = await User.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid Credentials");
  }
  user.password = newPassword;

  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Success! Password Updated." });
};

// FORGOT PASSWORD
// export async function updatePassword(req, res) {
//   const { email, password, confirmPassword } = req.body;

//   if (password !== confirmPassword)
//     throw new BadRequestError("Username field cannot be empty");

//   const updatedUser = await User.findOneAndUpdate(
//     email,
//     { $set: check },
//     { new: true }
//   );
//   if (!updatedUser) throw new notFoundError(`Can't find ${email}`);

//   return res.status(StatusCodes.OK).json({
//     username: updatedUser.username,
//     email: updatedUser.email,
//     id: updatedUser._id,
//   });
// }

// user.password = newPassword;

//   await user.save();
