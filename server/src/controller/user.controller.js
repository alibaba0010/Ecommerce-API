import BadRequestError from "../errors/badRequest.js";
import { StatusCodes } from "http-status-codes";
import User from "../model/user/user.mongo.js";
import notFoundError from "../errors/notFound.js";
import UnAuthenticatedError from "../errors/unaunthenticated.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/Email.js";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if ((!name, !email, !password))
    // if ((!name|| !email ||!password))
    throw new BadRequestError("Please fill all required field");
  if (password.length < 6)
    throw new BadRequestError("Password must be 6 or more characters");
  const checkEmailExist = await User.findOne({ email });
  if (checkEmailExist) throw new BadRequestError("Email already exists");

  const user = await User.create({ name, email, password });

  const token = await user.createJWT();

  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: false,
  });
  if (user) {
    const { name, id, email, image, contact, bio } = user;
    res
      .status(StatusCodes.CREATED)
      .json({ name, email, id, token, image, contact, bio }); //_id: user.id
  } else {
    throw new BadRequestError("Invalid User data");
  }
};

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if ((!email, !password))
    throw new BadRequestError("Please fill all required field");
  const checkUsers = await User.findOne({ email });
  if (!checkUsers) throw new UnAuthenticatedError("Invalid Credentials");

  const checkPassword = await checkUsers.comparePassword(password);
  if (!checkPassword) throw new UnAuthenticatedError("Invalid Password");

  const token = await checkUsers.createJWT();
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: false,
  });
  res.status(StatusCodes.OK).json({ email: checkUsers.email, token });
});

export const loginOutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: false,
  });
  return res.status(StatusCodes.OK).json({ msg: "Successfully logged out" });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Unable to get User");

  const { name, id, email, image, contact, bio } = user;

  return res
    .status(StatusCodes.OK)
    .json({ id, name, email, image, contact, bio });
});

export const checkUserStatus = asyncHandler(async (req, res) => {
  const token = await req.cookies.token;
  if (!token) res.json(false);
  const decode = jwt.verify(token, process.env.JWT_SEC);
  if (!decode) res.json(false);
  return res.json(true);
});
export const updateUserProfile = asyncHandler(async (req, res) => {
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
});

export const updateUserPassword = asyncHandler(async (req, res) => {
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
});

export const forgotPassword = asyncHandler(async (req, res) => {
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
});

export const resetPassword = asyncHandler(async (req, res) => {
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
});
