import User from "../models/user";
import { 
  compareType, 
  isMissing, 
  validatePaginationInput, 
  getOneWithSlug,
  validateConfirmString
} from "../utils/validator";

// Reusable function for validating username input.
const _validateUsername = (username, callback) => {
  if(isMissing(username))
    return callback("username is missing from input");

  if(!compareType(username, "string"))
    return callback("username must be a string");

  if(username.length < 3 || username.length > 26)
    return callback("username must be 3 - 26 characters in length");

  const regex = new RegExp("^[A-Za-z0-9-_]+$");
  if(!regex.test(username)){
    const errMessage = "username may only contain alphanumeric, - (dash), and _ (underscore) characters";
    return callback(errMessage);
  }

  const queryParams = {username: username.toLowerCase(), isActive: true};
  User.findOne(queryParams, (err, user) => {
    if(err)
      return callback(err);

    if(user)
      return callback("username is already taken");
    
    callback();
  });
};

// Reusable function for validating password input.
const _validatePassword = (password, callback) => {
  if(isMissing(password))
    return callback("password is missing from input");
  
  if(!compareType(password, "string"))
    return callback("password must be a string");

  if(password.length < 8)
    return callback("password must be at least 8 characters in length");
  
  const regex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$');
  if(!regex.test(password)){
    return callback("password must have 1 uppercase, lowercase, and number character");
  }

  callback();
};

const _validateCurrentPassword = (password, hash, callback) => {
  if(isMissing(password))
    return callback("current password is missing from input");
  
  if(!compareType(password, "string"))
    return callback("current password must be a string");
  
  User.compareHash(password, hash, (err, passwordIsValid) => {
    if(err)
      return callback(err);
    
    if(!passwordIsValid)
      return callback("current password is invalid");
    
    callback();
  });
};

const create = (req, res, next) => {
  const { username, password } = req.body;
  _validateUsername(username, (err) => {
    if(err && err.code)
      return res.fatalError(err);
    else if(err)
      return res.validationError(err);
    
    _validatePassword(password, (err) => {
      if(err)
        return res.validationError(err);
      
      next();
    });
  });
};

const getAll = (req, res, next) => {
  const queryStringInput = req.query;
  const countQueryArgs = {isActive: true};
  validatePaginationInput(
    User,
    countQueryArgs,
    queryStringInput, 
    (err, paginationData) => {
      if(err)
        return res.fatalError(err);
      
      req.paginationData = paginationData;
      next();
    }
  );
};

const usernameSlug = (req, res, next) => {
  const username = req.params.username.toLowerCase();
  const getQueryArgs = {
    username: username,
    isActive: true
  };
  const notFoundMsg = "requested user not found";
  const queryOptions = {};
  getOneWithSlug(
    User,
    getQueryArgs,
    notFoundMsg,
    queryOptions,
    (err, user) => {
      if(err && err.code)
        return res.fatalError(err);
      else if(err)
        return res.notFoundError(err);
      
      req.requestedUser = user;
      next();
    }
  );
};

const update = (req, res, next) => {
  const { password, currentPassword } = req.body;
  const { user } = req;
  _validateCurrentPassword(currentPassword, user.hash, (err) => {
    if(err)
      return res.validationError(err);

    _validatePassword(password, (err) => {
      if(err)
        return res.validationError(err);
      
      next();
    });
  });
};

const remove = (req, res, next) => {
  const confirm = req.body.confirm;
  const { user } = req;
  validateConfirmString(user, "username", confirm, (err) => {
    if(err)
      return res.validationError(err);
    
    next();
  });
};

export default {
  create,
  getAll,
  usernameSlug,
  update,
  remove
};
