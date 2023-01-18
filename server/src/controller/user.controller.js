import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import User from "../model/user/user.mongo.js";
import BadRequestError from "../errors/badRequest.js";
import UnAuthenticatedError from "../errors/unaunthenticated.js";
import notFoundError from "../errors/notFound.js";
import { getPagination } from "../services/query.js";
import { sendEmail } from "../services/Email.js";

import dotenv from "dotenv";
dotenv.config();
import { createClient } from "redis";
const redisClient = createClient({ url: process.env.REDIS_URI });

// ADD NEW USER
export async function httpAddNewUser(req, res) {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword)
    throw new BadRequestError("Password doesn't match");

  if (!username || !email || !password || !confirmPassword)
    throw new BadRequestError("Please fill all required field");

  const user = await User.create({ username, email, password });
  res
    .status(StatusCodes.CREATED)
    .json({ username: user.username, email: user.email, id: user._id });
}

// FOR ADMIN
export async function httpAddNewAdmin(req, res) {
  const admin = req.body;

  admin.isAdmin = true;
  const { username, email, password, confirmPassword, isAdmin } = admin;

  if (password !== confirmPassword)
    throw new BadRequestError("Password doesn't match");

  if (!username || !email || !password || !confirmPassword)
    throw new BadRequestError("Please fill all required field");

  const user = await User.create({ username, email, password, isAdmin });
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
export async function updateUser(req, res) {
  const { username } = req.body;
  const { userId } = req.user;

  if (!username) throw new BadRequestError("Username field cannot be empty");

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { $set: username },
    { new: true }
  );
  if (!updatedUser) throw new notFoundError(`No user with id ${userId}`);
  const { email, id } = updatedUser;

  res
    .status(StatusCodes.OK)
    .json({ username: updatedUser.username, email, id });
}

// GET ALL USERS
export async function getAllUserByAdmin(req, res) {
  //check pagination later
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
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) throw new notFoundError(`Unable to get User ${id}`);
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

export const updateUserPassword = async (req, res) => {
  const { userId } = req.user;

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new BadRequestError("Please provide required fields");
  }

  const user = await User.findById(userId);

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) throw new UnAuthenticatedError("Invalid Credentials");

  user.password = newPassword;

  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Success! Password Updated." });
};

// FORGOT PASSWORD
export async function forgotPassword(req, res) {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new notFoundError("Email doesn't exist");


  const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;

  // Reset Email
  const message = `
 <h2>Hello ${user.name}</h2>
 <p>Please use the url below to reset your password</p>  
 <p>This reset link is valid for only 20minutes.</p>

 <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

 <p>Regards...</p>
 <p>AliBaba Team</p>
`;

  const subject = "Password Reset Request";
  const sendTo = user.email;
  const sentFrom = process.env.EMAIL_USER;
  const replyTo = process.env.EMAIL_USER;
  try {
    const seen = await sendEmail(message, subject, sentFrom, sendTo, replyTo);
    return res
      .status(StatusCodes.OK)
      .json({ msg: "Resent sent", success: true });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    throw new Error("Email not sent, please try again");
  }
}

export const logOutUser = async (req, res) => {
  console.log("Token: ", token);
  return res.status(StatusCodes.OK).json({ msg: "Successfully logged out" });
}
