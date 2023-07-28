import { StatusCodes } from "http-status-codes";

export async function errorHandler(err, req, res, next) {
  let customError = {
    // set default
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR, //name: "ali" || process.env.name
    msg: err.message || "Something went wrong try again later",
  };

  if (err.name === "ValidationError") {
    console.log(Object.values(err.errors));
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(",");
    console.log(customError.msg);
    customError.statusCode = 400;
  }
  if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    customError.statusCode = 400;
  }
  if (err.name === "CastError") {
    customError.msg = `No item found with id : ${err.value}`;
    customError.statusCode = 404;
  }
  console.log(`${customError.statusCode} with ${customError.msg}`);
  return res.status(customError.statusCode).json({ msg: customError.msg });
}
