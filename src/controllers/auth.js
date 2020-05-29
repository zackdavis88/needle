import User from "../models/user";
import jwt from "jsonwebtoken";
import { secret } from "../../config/auth";

const generateToken = (req, res) => {
  const { decodedCredentials } = req;
  const username = decodedCredentials[0];
  const password = decodedCredentials[1];

  var queryArgs = {
    username: username.toLowerCase(),
    isActive: true
  };
  User.findOne(queryArgs, (err, user) => {
    if(err)
      return res.fatalError(err);
    
    if(!user)
      return res.authenticationError("username and password combination is invalid");
    
    User.compareHash(password, user.hash, (err, passwordIsValid) => {
      if(err)
        return res.fatalError(err);
      
      if(!passwordIsValid)
        return res.authenticationError("username and password combination is invalid");
      
      const tokenData = {
        _id: user._id,
        apiKey: user.apiKey
      };
      const jwtOptions = { expiresIn: "10h" };
      const token = jwt.sign(tokenData, secret, jwtOptions);
      const userData = {
        user: {
          username: user.username,
          displayName: user.displayName,
          createdOn: user.createdOn,
          updatedOn: user.updatedOn
        }
      };
      res.set("x-needle-token", token);
      res.success("user successfully authenticated", userData);
    });
  });
};

const authenticateToken = (req, res, next) => {
  const {
    _id,
    apiKey
  } = req.tokenData;
  const queryArgs = {
    _id,
    apiKey,
    isActive: true
  };
  User.findOne(queryArgs, (err, user) => {
    if(err)
      return res.fatalError(err);
    
    if(!user)
      return res.authenticationError("x-needle-token user could not be authenticated");
    
    req.user = user;
    next();
  });
}

const authorizeUserChange = (req, res, next) => {
  const requestingUser = req.user;
  const requestedUser = req.params.username.toLowerCase();

  if(requestingUser.username !== requestedUser)
    return res.authorizationError("you do not have permission to perform this action");

  next();
};

export default {
  generateToken,
  authenticateToken,
  authorizeUserChange
};
