import { createClient } from "redis";
import { StatusCodes } from "http-status-codes";
import User from "../model/user/user.mongo.js";
import BadRequestError from "../errors/badRequest.js";
import UnAuthenticatedError from "../errors/unaunthenticated.js";
import notFoundError from "../errors/notFound.js";
import { getPagination } from "../services/query.js";
import { sendEmail } from "../services/Email.js";
import geocoder from "../services/geocoder.js";

import {
  checkAdmin,
  checkEmailExists,
  comparePassword,
  findUser,
  requiredFields,
} from "../model/user/user.model.js";

import dotenv from "dotenv";
dotenv.config();
const redisClient = createClient({ url: process.env.REDIS_URI });

// ADD NEW USER
export async function httpAddNewUser(req, res) {
  const { username, email, password, confirmPassword } = req.body;

  comparePassword(password, confirmPassword);

  requiredFields(username, email, password, confirmPassword);

  await checkEmailExists(email);

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

  comparePassword(password, confirmPassword);

  requiredFields(username, email, password, confirmPassword);

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

  const user = await User.findById(userId);
  if (!user) throw new notFoundError("User not Found");

  user.username = username;

  const updatedUser = await user.save();

  if (!updatedUser) throw new notFoundError(`No user with id ${userId}`);
  const { email, id } = updatedUser;

  res
    .status(StatusCodes.OK)
    .json({ username: updatedUser.username, email, id });
}

// GET ALL USERS
export async function getAllUserByAdmin(req, res) {
  const { userId } = req.user;

  await checkAdmin(userId);

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
  const { userId } = req.user;

  await checkAdmin(userId);

  const user = await User.findById(id);
  if (!user) throw new notFoundError(`Unable to get User ${id}`);
  const { password, __v, ...others } = user._doc;
  res.status(StatusCodes.OK).json({
    others,
    request: {
      type: "GET",
      url: `http://localhost:2000/v1/user/${id}`,
    },
  });
}
// Hasn't been used
export const showCurrentUser = async (req, res) => {
  const { userId } = req.user;
  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Unable to get User");

  const { username, id, email, isAdmin } = user;

  return res.status(StatusCodes.OK).json({ username, id, email, isAdmin });
};

// Edit Password
export const updateUserPassword = async (req, res) => {
  const { userId } = req.user;

  await findUser(userId);

  const user = await User.findById(userId);

  const { password, newPassword } = req.body;
  if (!password || !newPassword) {
    throw new BadRequestError("Please provide required fields");
  }

  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) throw new UnAuthenticatedError("Invalid Credentials");

  user.password = newPassword;

  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Success! Password Updated." });
};

// LOGOUT USER
export const logOutUser = async (req, res) => {
  const { userId } = req.user;

  await findUser(userId);

  await redisClient.connect();
  const token = await redisClient.get(userId);
  const check = await redisClient.del(token);
  await redisClient.disconnect();

  return res.status(StatusCodes.OK).json({ msg: "Successfully logged out" });
};

// FORGOT PASSWORD
export async function forgotPassword(req, res) {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new notFoundError("Email doesn't exist");

  await redisClient.connect();

  let resetToken = await user.createPasswordToken();
  const getToken = await redisClient.get(user.id);
  if (getToken) await redisClient.del(getToken);
  await redisClient.disconnect();

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
    await sendEmail(message, subject, sentFrom, sendTo, replyTo);
    return res
      .status(StatusCodes.OK)
      .json({ msg: "Email sent", success: true });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    throw new Error("Email not sent, please try again");
  }
}

export const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password, confirmPassword } = req.body;

  comparePassword(password, confirmPassword);

  // Hash token, then compare to Token in redis DB
  const hashedToken = createHash("sha256").update(resetToken).digest("hex");

  const userToken = await redisClient.get(hashedToken);
  if (!userToken) throw new notFoundError("Invalid or Expired Token");

  // Find user
  const user = await Token.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(StatusCodes.OK).json({
    msg: "Password Reset Successful, Please Login",
  });
};

export const httpGetUsersStats = async (req, res) => {
  const { userId } = req.user;

  await checkAdmin(userId);

  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

  const data = await User.aggregate([
    { $match: { createdAt: { $gte: lastYear } } },
    {
      $project: {
        month: { $month: "$createdAt" },
      },
    },
    {
      $group: {
        _id: "$month",
        total: { $sum: 1 },
      },
    },
  ]);
  res.status(StatusCodes.OK).json(data);
};

// ADD Address and Payment Information
export const httpAddAddress = async (req, res) => {
  const { address, paymentInformation } = req.body;
  const { userId } = req.user;
  const user = await User.findById(userId).select("-password");
  if (!user) throw new notFoundError("Login to Add Address");
  if (!address || !paymentInformation)
    throw new BadRequestError("Please provide address and payment Information");

  const loc = await geocoder.geocode(address);
  console.log("addresses: ", user.addresses.location);
  user.addresses.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
  };
  // Do not save address
  console.log("addresses: ", user.addresses.location);
  user.address = undefined;
  user.addresses.location = loc;
  user.paymentInformation = paymentInformation;
  await user.save();

  return res
    .status(StatusCodes.CREATED)
    .json({ msg: "Address successfully added" });
  // }
};

// UPDATE USER ADDRESS
export async function httpUpdateAddress(req, res) {
  const { address } = req.body;
  const { userId } = req.user;
  const user = await User.findById(userId).select("-password");
  if (!user) throw new notFoundError("Login to Add Address");
  if (!address) throw new BadRequestError("Please provide address");
  const loc = await geocoder.geocode(address);
  const newAddress = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
  };
  console.log("new Address: ", newAddress);
  user.addresses.push(newAddress);
  console.log("addresses: ", user.addresses.location);

  // Do not save address
  user.address = undefined;
  const newAdd = user.addresses;
  const updateOrder = await User.updateOne({ $push: { newAdd: newAddress } });
  console.log("updatedAddress: ", updateOrder);
  await user.save();
  console.log("user: ", user);
  return res.status(204).json({ msg: "Address added successfully" });
}
