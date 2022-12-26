import jwt from "jsonwebtoken";
import UnauthenticatedError from "../errors/unaunthenticated.js";
import UnAuthorizedError from "../errors/unauthorized.js";

import User from "../model/user/user.mongo.js";

export const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthenticatedError("Provide an authentic token");
  }
  const token = authHeader.split(" ")[1];
  try {
    const decode = jwt.verify(token, process.env.JWT_SEC);

    req.user = { userId: decode.userId, isAdmin: decode.isAdmin };

    next();
  } catch (err) {
    throw new UnauthenticatedError("Unable to authorize access");
  }
};

// VERIFY USER
export function verifyUser(req, res, next) {
  if (req.params.id === req.user.userId) {
    next();
  } else {
    throw new UnAuthorizedError("Access Denied!!!");
  }
}
// VERIFY USERS WITHOUT PARAMS
export async function verifyUserWithId(req, res, next) {
  const user = await User.findById(req.user.userId);
  if (user) {
    next();
  } else {
    throw new UnAuthorizedError("Access Denied user");
  }
}

// VERIFY ADMIN WITHOUT PARAMS
export async function verifyAdminWithId(req, res, next) {
  const user = await User.findById(req.user.userId);
  if (user || user.isAdmin === true) {
    next();
  } else {
    throw new UnAuthorizedError("Access Denied admin");
  }
}

// VERIFY ADMIN
export function verifyAdmin(req, res, next) {
  if (req.user.isAdmin === true || req.params.id === req.user.userId) {
    next();
  } else {
    throw new UnAuthorizedError("Access Denied!!");
  }
}
