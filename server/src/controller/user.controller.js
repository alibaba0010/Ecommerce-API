import { createClient } from "redis";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { getPagination } from "../services/query.js";
import geocoder from "../services/geocoder.js";
import User from "../model/user/user.mongo.js";
import BadRequestError from "../errors/badRequest.js";
import notFoundError from "../errors/notFound.js";
import UnAuthenticatedError from "../errors/unaunthenticated.js";
import { sendEmail } from "../services/Email.js";
import {
  checkAdmin,
  checkIfExists,
  comparePassword,
  findUser,
  requiredFields,
  checkValue,
} from "../model/user/user.model.js";
const { randomBytes, createHash } = await import("node:crypto");

import dotenv from "dotenv";
dotenv.config();
// const redisClient = createClient({ url: process.env.REDIS_URI });
const redisClient = createClient();

// CREATE NEW USER
export async function httpAddNewUser(req, res) {
  const { username, email, password, confirmPassword } = req.body;

  comparePassword(password, confirmPassword);

  requiredFields(username, email, password, confirmPassword);

  await checkIfExists(email, username);

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
  await checkIfExists(email, username);
  const user = await User.create({ username, email, password, isAdmin });
  res
    .status(StatusCodes.CREATED)
    .json({ username: user.username, email: user.email, id: user._id });
}

// LOGIN
export async function httpLogin(req, res) {
  const { value, password } = req.body;
  if (!value || !password)
    throw new BadRequestError("Provide a username or email and password");
  const user = await checkValue(value);
  const comparePassword = await user.comparePassword(password);
  if (!comparePassword) throw new UnAuthenticatedError("Invalid Password");
  const token = await user.createJWT();
  req.session = {
    jwt: token,
  };
  res.status(StatusCodes.OK).json({ id: user.id, username: user.username });
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

  const { email, id } = updatedUser;

  res
    .status(StatusCodes.OK)
    .json({ username: updatedUser.username, email, id });
}

// GET ALL USERS
export async function getAllUserByAdmin(req, res) {
  const { userId } = req.user;

  await checkAdmin(userId);

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
  if (!user) throw new notFoundError(`Unable to get User ${userId}`);
  const { password, _id, __v, ...others } = user._doc;
  res.status(StatusCodes.OK).json({
    others,
    request: {
      type: "GET",
      url: `http://localhost:2000/v1/user/${id}`,
    },
  });
}

// SHOW CURRENT USER
export const showCurrentUser = async (req, res) => {
  const { userId } = req.user;
  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Unable to get User");

  const { username, id, email, isAdmin } = user;

  return res.status(StatusCodes.OK).json({ username, id, email, isAdmin });
};

/********NOT OPTIMIZED YET */
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

// LOGOUT USER
export const logOutUser = async (req, res) => {
  const { userId } = req.user;
  await findUser(userId);

  return res.status(StatusCodes.OK).json({ msg: "Successfully logged out" });
};

// USER UPDATING THEIR PASSWORD
export const updateUserPassword = async (req, res) => {
  const { userId } = req.user;

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    throw new BadRequestError("Please fill all required field");

  const user = await User.findById(userId);
  if (!user) throw new notFoundError("User not Found");

  const checkPassword = await user.comparePassword(oldPassword);
  if (!checkPassword) throw new UnAuthenticatedError("Invalid Password");
  user.password = newPassword;
  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Password change successful" });
};

// FORGOT PASSWORD FUNCTIONALITY
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new notFoundError("Email doesn't exist");
  console.log("User Id: ", user.id);
  // // Delete token if it exists in DB
  await redisClient.connect();

  // Create reset token
  let resetToken = await user.createPasswordToken();
  console.log("Resrt Token: ", resetToken);
  const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;
  console.log("Reset Url: ", resetUrl);
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
  // await redisClient.disconnect();
  try {
    const seen = await sendEmail(message, subject, sentFrom, sendTo, replyTo);
    return res
      .status(StatusCodes.OK)
      .json({ msg: "Resent sent", success: true });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    throw new Error("Email not sent, please try again");
  }
};

// RESET PASSWORD FUNCTIONALITY
export const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword)
    throw new BadRequestError("Password doesn't match");
  // Hash token, then compare to Token in DB
  const hashedToken = createHash("sha256").update(resetToken).digest("hex");

  // fIND tOKEN in DB
  // const userToken = await Token.findOne({
  //   token: hashedToken,
  //   expiresAt: { $gt: Date.now() },
  // });
  // if (!userToken) throw new notFoundError("Invalid or Expired Token");

  // Find user
  // const user = await Token.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(StatusCodes.OK).json({
    msg: "Password Reset Successful, Please Login",
  });
};

// UPDATE USER ADDRESS
// ADD Address and Payment Information
export const httpAddAddress = async (req, res) => {
  const { address, paymentInformation } = req.body;
  const { userId } = req.user;
  const user = await User.findById(userId).select("-password");
  if (!user) throw new notFoundError("Login to Add Address");
  if (!address || !paymentInformation)
    throw new BadRequestError("Please provide address and payment Information");

  const loc = await geocoder.geocode(address);
  user.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
  };
  // Do not save address
  user.address = undefined;
  await User.create({ loc, paymentInformation });

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

  if (!address)
    throw new BadRequestError("Please provide address and payment Information");
  const loc = await geocoder.geocode(address);

  const newAddress = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
  };
  user.addresses.push(newAddress);
  console.log("addresses: ", user.addresses.location);

  // Do not save address
  user.address = undefined;
  // user.location = loc;

  user.paymentInformation = paymentInformation;

  const newAdd = user.addresses;

  const updateOrder = await User.updateOne({ $push: { newAdd: newAddress } });

  await user.save();
  return res.status(StatusCodes.OK).json({ msg: "Address added successfully" });
}

// formattedAddress: loc[0].formattedAddress,
// };
// console.log("new Address: ", newAddress);
// user.location.push(newAddress);
// console.log("newLocation: ", user.location);

// // Do not save address
// user.address = undefined;
// // const newAdd = user.addresses;
// // const updateOrder = await User.updateOne({ $push: { newAdd: newAddress } });
// // console.log("updatedAddress: ", updateOrder);
// await user.save();
// console.log("user: ", user);
// res.status(StatusCodes.OK).json({ msg: "Address added successfully" });

// throw new BadRequestError("Please provide address and payment Information");

// // Do not save address
// user.address = undefined;
// // user.location = loc;
// // console.log("LOC: ", loc);
// user.paymentInformation = paymentInformation;

/*******ADDING OTHER PROPERTIES FOR A USER */
// export const updateUser = async (req, res) => {
//   const { userId } = req.user;
//   const user = await User.findById(userId);
//   if (!user) throw new notFoundError("Unable to get User");

//   const { name, image, contact, bio } = req.body;
//   user.email = user.email;
//   user.name = name || user.name;
//   user.image = image || user.image;
//   user.contact = contact || user.contact;
//   user.bio = bio || user.bio;

//   const updatedUser = await user.save();
//   return res.status(StatusCodes.OK).json({
//     id: updatedUser.id,
//     name: updatedUser.name,
//     email: updatedUser.email,
//     image: updatedUser.image,
//     contact: updatedUser.contact,
//     bio: updatedUser.bio,
//   });
// };
