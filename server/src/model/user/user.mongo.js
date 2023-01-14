import pkg from "mongoose";
const { Schema, model } = pkg;

// import redis from "redis";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// const redisClient = redis.createClient({
//   host: "localhost",
//   port: "127.0.0.1",
// });

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Please provide name"],
      unique: [true, "Username already in use"],
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please provide a valid email",
      ],
      unique: [true, "Email already in use"],
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: 6,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// To hash password
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) next(); //{}
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.createJWT = async function () {
  const signInToken = jwt.sign(
    { userId: this._id, isAdmin: this.isAdmin },
    process.env.JWT_SEC,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );
  // const redisStorage = await redisClient.set(signInToken, id);
  // console.log("redisStorage:", redisStorage);
  return signInToken;
  // return { signInToken, redisStorage };
};

// compare password when login in
UserSchema.methods.comparePassword = async function (userPassword) {
  const passwordMatch = await bcrypt.compare(userPassword, this.password);

  return passwordMatch;
};

export default model("User", UserSchema);
