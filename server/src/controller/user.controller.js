import { createClient } from "redis";
import { StatusCodes } from "http-status-codes";
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

import dotenv from "dotenv";
import UnAuthorizedError from "../errors/unauthorized.js";
import NotFoundError from "../errors/notFound.js";
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
  res
    .status(StatusCodes.OK)
    .json({ id: user.id, username: user.username, token });
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

  req.session = null;
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
  await redisClient.connect();
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new notFoundError("Email doesn't exist");

  // Create reset token
  let resetToken = await user.createPasswordToken();
  const resetUrl = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;
  // Reset Email
  const message = `
  <h2>Hello ${user.username}</h2>
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
    await redisClient.disconnect();

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
  await redisClient.connect();

  if (password !== confirmPassword)
    throw new BadRequestError("Password doesn't match");
  // Hash token, then compare to Token in DB
  const getUserId = await redisClient.get(resetToken);

  if (!getUserId) throw new BadRequestError("Link not valid");

  // Find user
  const user = await User.findById(getUserId);
  if (!user) throw new notFoundError("User not Found");

  user.password = password;
  await user.save();
  await redisClient.disconnect();
  res.status(StatusCodes.OK).json({
    msg: "Password Reset Successful, Please Login",
  });
};

/****** UPDATE USER ADDRESS **/
// ADD Address and Payment Information
export const httpAddAddress = async (req, res) => {
  const { address, paymentInformation } = req.body;
  const { userId } = req.user;
  const user = await User.findById(userId).select("-password");
  if (!user) throw new notFoundError("Login to Add Address");
  if (!address || !paymentInformation)
    throw new BadRequestError("Please provide address and payment Information");

  const loc = await geocoder.geocode(address);
  if (user.location.length > 0)
    throw new UnAuthorizedError("Address already exists");
  user.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
  };
  // Do not save address
  user.address = undefined;
  user.paymentInformation = paymentInformation;

  await user.save();
  const userAddress = user.location.map((address) => address.formattedAddress);
  return res
    .status(StatusCodes.CREATED)
    .json({ msg: "Address successfully added", userAddress });
  // }
};

// UPDATE USER ADDRESS
export async function httpUpdateAddress(req, res) {
  const { address } = req.body;
  const { userId } = req.user;
  const user = await User.findById(userId).select("-password");
  if (!user) throw new NotFoundError("Login to Add Address");

  if (!address) throw new BadRequestError("Please provide address");

  if (user.location.length === 3)
    throw new UnAuthorizedError("Unable to add address");
  const loc = await geocoder.geocode(address);

  const newAddress = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
  };
  user.location.push(newAddress);

  // Do not save address
  user.address = undefined;

  await user.save();
  const userAddress = user.location.map((address) => address.formattedAddress);
  return res
    .status(StatusCodes.OK)
    .json({ msg: "Address updated successfully", userAddress });
}
//GENERATE OTP TO BE SENT TO EMAIL
export const generateOtp = async (req, res) => {
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  res.status(StatusCodes.OK).json({ message: "OTP generated successfully" });
};

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
