import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { secret } from "../../config/auth";

const basicAuthHeader = (req, res, next) => {
  const header = req.headers["x-needle-basic"];
  if(!header)
    return res.validationError("x-needle-basic header is missing from input");

  const encodedRegex = new RegExp("^Basic .+$");
  if(!encodedRegex.test(header))
    return res.validationError("x-needle-basic must use Basic Auth");
  
  const decodedRegex = new RegExp("^[A-Za-z0-9-_]+[:].*$");
  let decodedCredentials = header.split(" ");
  decodedCredentials = Buffer.from(decodedCredentials[1], "base64");
  decodedCredentials = decodedCredentials.toString("ascii");
  if(!decodedRegex.test(decodedCredentials))
    return res.validationError("x-needle-basic credentials have invalid format");
  
  decodedCredentials = decodedCredentials.split(/:(.*)/);

  // Attach the credentials to the req object so that the controller method can validate them.
  req.decodedCredentials = decodedCredentials;
  next();
};

const jwtHeader = (req, res, next) => {
  const header = req.headers["x-needle-token"];
  if(!header)
    return res.validationError("x-needle-token header is missing from input");
  
  jwt.verify(header, secret, (err, tokenData) => {
    if(err && err.name.toLowerCase() === "tokenexpirederror")
      return res.authenticationError("x-needle-token is expired");
    
    if(err && err.name.toLowerCase() === "jsonwebtokenerror")
      return res.authenticationError("x-needle-token is invalid");
    
    const {
      _id,
      apiKey
    } = tokenData;
    if(!_id || !apiKey)
      return res.authenticationError("x-needle-token is missing required fields");

    if(!mongoose.Types.ObjectId.isValid(_id)){
      return res.validationError("x-needle-token contains an invalid id");
    }

    req.tokenData = tokenData;
    next();
  });
};

export default {
  basicAuthHeader,
  jwtHeader
};
