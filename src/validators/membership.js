import User from "../models/user";
import Membership from "../models/membership";
import mongoose from "mongoose";
import { 
  compareType, 
  isMissing, 
  validatePaginationInput,
  getOneWithSlug,
  validateConfirmBoolean
} from "../utils/validator";

const _validateUsername = (username, callback) => {
  if(isMissing(username))
    return callback("username is missing from input");
  
  if(!compareType(username, "string"))
    return callback("username must be a string");

  const queryArgs = {username: username.toLowerCase(), isActive: true};
  User.findOne(queryArgs, (err, user) => {
    if(err)
      return callback(err);
    
    if(!user)
      return callback("requested user does not exist");
    
    callback(null, user);
  });
};

const _validateRoles = (roles, callback) => {
  if(isMissing(roles))
    return callback("roles is missing from input");
  
  if(!compareType(roles, "object"))
    return callback("roles must be an object with boolean key-values");

  if(Object.keys(roles).length === 0)
    return callback("roles input contains no roles");
  
  const adminMissing = isMissing(roles.isAdmin);
  const managerMissing = isMissing(roles.isManager);
  const developerMissing = isMissing(roles.isDeveloper);
  const viewerMissing = isMissing(roles.isViewer);
  if(adminMissing && managerMissing && developerMissing && viewerMissing)
    return callback("roles must contain at least one valid role");
  
  callback();
};

const create = (req, res, next) => {
  const { username, roles } = req.body;
  const project = req.project;
  // Validate that the user exists.
  _validateUsername(username, (err, user) => {
    if(err && err.code)
      return res.fatalError(err);
    else if(err)
      return res.validationError(err);
    
    // Validate that there is not already an existing membership.
    const queryArgs = {project: project._id, user: user._id};
    Membership.findOne(queryArgs, (err, membership) => {
      if(err)
        return res.fatalError(err);
      
      if(membership)
        return res.validationError("membership already exists");

      _validateRoles(roles, (err) => {
        if(err)
          return res.validationError(err);
        
        req.member = user;
        next();
      });
    });
  });
};

const getAll = (req, res, next) => {
  const { project, query } = req;
  const countQueryArgs = { project: project._id };
  validatePaginationInput(
    Membership,
    countQueryArgs,
    query, 
    (err, paginationData) => {
      if(err)
        return res.fatalError(err);
      
      req.paginationData = paginationData;
      next();
    }
  );
};

const membershipIdSlug = (req, res, next) => {
  const membershipId = req.params.membershipId.toLowerCase();
  const { project } = req;
  if(!mongoose.Types.ObjectId.isValid(membershipId))
    return res.validationError("membership id is not valid");
  
  const getQueryArgs = { project: project._id, _id: membershipId };
  const notFoundMsg = "requested membership not found";
  const queryOptions = {
    populate: {
      user: "-_id username displayName"
    }
  };
  getOneWithSlug(
    Membership,
    getQueryArgs,
    notFoundMsg,
    queryOptions,
    (err, membership) => {
      if(err && err.code)
        return res.fatalError(err);
      else if(err)
        return res.notFoundError(err);
      
      req.membership = membership;
      next();
    }
  );
};

const update = (req, res, next) => {
  const { roles } = req.body;
  _validateRoles(roles, (err) => {
    if(err)
      return res.validationError(err);
    
    next();
  })
};

const remove = (req, res, next) => {
  const { confirm } = req.body;
  validateConfirmBoolean(confirm, (err) => {
    if(err)
      return res.validationError(err);
    
    next();
  });
};

export default {
  create,
  getAll,
  membershipIdSlug,
  update,
  remove
};