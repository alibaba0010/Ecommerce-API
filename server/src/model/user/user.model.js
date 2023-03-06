import BadRequestError from "../../errors/badRequest.js";
import UnAuthenticatedError from "../../errors/unaunthenticated.js";
import UnAuthorizedError from "../../errors/unauthorized.js";
import notFoundError from "../../errors/notFound.js";
import User from "./user.mongo.js";

export const comparePassword = (password, confirmPassword) => {
  if (password !== confirmPassword)
    throw new BadRequestError("Password doesn't match");
};
export const requiredFields = (username, email, password, confirmPassword) => {
  if (!username || !email || !password || !confirmPassword)
    throw new BadRequestError("Please fill all required field");
};

export const checkEmailExists = async (email) => {
  const checkEmailExist = await User.findOne({ email });
  if (checkEmailExist) throw new BadRequestError("Email already exists");
};

export const checkPasswords = async (password) => {
  const checkPassword = await checkUsers.comparePassword(password);
  if (!checkPassword) throw new UnAuthenticatedError("Invalid Password");
};

export const checkAdmin = async (userId) => {
  const user = await User.findById(userId);

  if (user.isAdmin !== true)
    throw new UnAuthorizedError("Only admin is ascessible");
};

export const findUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new notFoundError("Unable to get user");
};
