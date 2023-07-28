import BadRequestError from "../errors/badRequest.js";
import { StatusCodes } from "http-status-codes";
import User from "../model/user/user.mongo.js";
import notFoundError from "../errors/notFound.js";
import UnAuthenticatedError from "../errors/unaunthenticated.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/Email.js";
import {
  checkAdmin,
  checkEmailExists,
  comparePassword,
  findUser,
  requiredFields,
} from "../model/user/user.model.js";

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
    .status(StatusCodes.CREATED)
    .json({ username: user.username, email: user.email, id: user._id });
}
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

export async function httpGetUsersStats(req, res) {}

// Hasn't been used
export const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};
export const logOutUser = async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: false,
  });
  return res.status(StatusCodes.OK).json({ msg: "Successfully logged out" });
};

export const getCurrentUser = async (req, res) => {
  const { userId } = req.user;
  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Unable to get User");

  const { name, id, email, image, contact, bio } = user;

  return res
    .status(StatusCodes.OK)
    .json({ id, name, email, image, contact, bio });
};

export const checkUserStatus = async (req, res) => {
  const token = await req.cookies.token;
  if (!token) res.json(false);
  const decode = jwt.verify(token, process.env.JWT_SEC);
  if (!decode) res.json(false);
  return res.json(true);
};
export const updateUser = async (req, res) => {
  const { userId } = req.user;
  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Unable to get User");

  const { name, image, contact, bio } = req.body;
  user.email = user.email;
  user.name = name || user.name;
  user.image = image || user.image;
  user.contact = contact || user.contact;
  user.bio = bio || user.bio;

  const updatedUser = await user.save();
  return res.status(StatusCodes.OK).json({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    image: updatedUser.image,
    contact: updatedUser.contact,
    bio: updatedUser.bio,
  });
};

export const updateUserPassword = async (req, res) => {
  const { userId } = req.user;

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword && !newPassword)
    throw new BadRequestError("Please fill all required field");

  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Unable to get User");

  const checkPassword = await user.comparePassword(oldPassword);
  if (!checkPassword) throw new UnAuthenticatedError("Invalid Password");
  user.password = newPassword;
  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Password change successful" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new notFoundError("Email doesn't exist");

  // // Delete token if it exists in DB
  // const token = await Token.findOne({ userId: user._id });
  // if (token) {
  //   await token.deleteOne();
  // }

  // Create reset token
  // let resetToken = await user.createPasswordToken();
  let resetToken = randomBytes(32).toString("hex") + user.id;
  // Hash token before saving to DB
  const hashedToken = createHash("sha256").update(resetToken).digest("hex");
  // Save Token to DB
  await new Token({
    userId: user.id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 20 * (60 * 1000), // Twenty minutes
  }).save();

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
};

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
