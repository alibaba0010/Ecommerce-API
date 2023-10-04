import pkg, { Types } from "mongoose";
const { Schema, model } = pkg;
import dotenv from "dotenv";
dotenv.config();
import { createClient } from "redis";
import geocoder from "../../services/geocoder.js";
const { randomBytes, createHash } = await import("node:crypto");

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const exp = process.env.JWT_LIFETIME;
// const redisClient = createClient({ url: process.env.REDIS_URI });
const redisClient = createClient();

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
        // /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        /^[\w\.-]+@[a-zA-Z\d\.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email",
      ],
      unique: [true, "Email already in use"],
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: [6, "Password must be up to 6 characters"],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    paymentInformation: {
      type: String,
    },
    address: {
      type: [String],
    },
    location: [
      {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
          index: "2dsphere",
        },
        formattedAddress: String,
      },
    ],
  },

  { timestamps: true }
);

// To hash password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next(); //{}
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.createJWT = async function () {
  const signInToken = jwt.sign(
    { userId: this._id, isAdmin: this.isAdmin },
    process.env.JWT_SEC,
    {
      expiresIn: exp,
    }
  );
  // const redis = await redisClient.setEx(this.id, exp, signInToken);
  return signInToken;
};

// Create forgot password token
UserSchema.methods.createPasswordToken = async function () {
  await redisClient.connect();
  let resetToken = randomBytes(32).toString("hex") + this._id;
  const hashedToken = createHash("sha256").update(resetToken).digest("hex");

  await redisClient.setEx(this.id, exp, hashedToken);
  const checkToken = await redisClient.get(this.id);
  await redisClient.disconnect();
  return hashedToken;
};

// compare password when login in
UserSchema.methods.comparePassword = async function (userPassword) {
  const passwordMatch = await bcrypt.compare(userPassword, this.password);

  return passwordMatch;
};
// // Geocode & create location
// UserSchema.pre("findOneAndUpdate", async function (next) {
//   if (this._update.location) {
//     console.log("in here");
//     const loc = await geocoder.geocode(this.address);
//     this.location = {
//       type: "Point",
//       coordinates: [loc[0].longitude, loc[0].latitude],
//       formattedAddress: loc[0].formattedAddress,
//     };

//     // Do not save address
//     this.address = undefined;
//     this._update.$push = { location: this._update.location };
//   }
//   next();
// });

export default model("User", UserSchema);
