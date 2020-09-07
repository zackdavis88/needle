import User from "../models/user";
import Membership from "../models/membership";
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

const authorizeAdmin = (req, res, next) => {
  const { user, project } = req;

  Membership.findOne({user: user._id, project: project._id}, (err, membership) => {
    if(err)
      return res.fatalError(err);
    
    if(!membership)
      return res.authorizationError("you must be a project member to perform this action");

    if(!membership.roles.isAdmin)
      return res.authorizationError("you must have admin permissions to perform this action");
    
    req.requestMembership = membership;
    next();
  });
};

const authorizeManager = (req, res, next) => {
  const { user, project } = req;

  Membership.findOne({user: user._id, project: project._id}, (err, membership) => {
    if(err)
      return res.fatalError(err);

    if(!membership)
      return res.authorizationError("you must be a project member to perform this action");
    
    const adminRequired = (
      (req.body.roles && typeof req.body.roles.isAdmin === "boolean") ||
      (req.body.confirm && req.membership && req.membership.roles.isAdmin)
    );

    if(adminRequired && !membership.roles.isAdmin)
      return res.authorizationError("you must have admin permissions to perform this action");

    if(!membership.roles.isAdmin && !membership.roles.isManager)
      return res.authorizationError("you must have manager permissions to perform this action");
    
    req.requestMembership = membership;
    next();
  });
};

const authorizeDeveloper = (req, res, next) => {
  const { user, project } = req;

  Membership.findOne({user: user._id, project: project._id}, (err, membership) => {
    if(err)
      return res.fatalError(err);

    if(!membership)
      return res.authorizationError("you must be a project member to perform this action");
    
    const { isAdmin, isManager, isDeveloper } = membership.roles;
    if(!isAdmin && !isManager && !isDeveloper)
      return res.authorizationError("you must have developer permissions to perform this action");
    
    req.requestMembership = membership;
    next();
  });
};

const authorizeViewer = (req, res, next) => {
  const { user, project } = req;
  
  Membership.findOne({user: user._id, project: project._id}, (err, membership) => {
    if(err)
      return res.fatalError(err);

    req.requestMembership = membership; // attach the requestMembership
    if(!project.isPrivate)
      return next();

    if(!membership)
      return res.authorizationError("you must be a project member to perform this action");

    const { isAdmin, isManager, isDeveloper, isViewer } = membership.roles;
    if(!isAdmin && !isManager && !isDeveloper && !isViewer)
      return res.authorizationError("you must have viewer permissions to perform this action");
    
    next();
  });
};

const validateToken = (req, res) => {
  const {user} = req;
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
  res.success("user successfully authenticated via token", userData);
};

export default {
  generateToken,
  authenticateToken,
  authorizeUserChange,
  authorizeAdmin,
  authorizeManager,
  authorizeDeveloper,
  authorizeViewer,
  validateToken
};
