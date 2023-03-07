import { config } from "dotenv";
config();

export default {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URL,
  EMAIL_USER: process.env.EMAIL_USER,
  JWT_SEC: process.env.JWT_SEC,
  JWT_LIFETIME: process.env.JWT_LIFETIME,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  EMAIL_HOST: process.env.EMAIL_HOST,
  CLIENT_URL: process.env.CLIENT_URL,
  CLOUD_NAME: process.env.CLOUD_NAME,
  CLOUD_API_KEY: process.env.CLOUD_API_KEY,
  CLOUD_API_SECRET: process.env.CLOUD_API_SECRET,
  GEOCODER_API_KEY: process.env.GEOCODER_API_KEY,
  GEOCODER_PROVIDER: process.env.GEOCODER_PROVIDER,
};
