export function logResponse(req, res, context, ee, next) {
  // console.log("Request body: ", req.json);
  // console.log("Status:", res.statusCode, "Body:", res.body);
  return next();
}
