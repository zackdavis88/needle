import Project from "../models/project";
import mongoose from "mongoose";
import { 
  compareType, 
  isMissing, 
  validatePaginationInput, 
  getOneWithSlug,
  validateConfirmString
} from "../utils/validator";

const _validateName = (name, isOptional, callback) => {
  if(isOptional && isMissing(name))
    return callback();
  
  if(isMissing(name))
    return callback("name is missing from input");

  if(!compareType(name, "string"))
    return callback("name must be a string");

  if(name.length < 3 || name.length > 50)
    return callback("name must be 3 - 50 characters in length");

  const regex = new RegExp("^[A-Za-z0-9-_+=&^%$#*@!|\/(){}?.,<>;':\" ]+$");
  if(!regex.test(name))
    return callback("name contains invalid characters");

  callback();
};

const _validateDescription = (description, callback) => {
  if(isMissing(description))
    return callback();

  if(!compareType(description, "string"))
    return callback("description must be a string");

  if(description.length > 350)
    return callback("description must be 350 characters or less");
  
  callback();
};

const _validatePrivate = (isPrivate, callback) => {
  if(isMissing(isPrivate))
    return callback();
  
  if(!compareType(isPrivate, "boolean"))
    return callback("isPrivate must be a boolean");
  
  callback();
};

const create = (req, res, next) => {
  const { name, description, isPrivate } = req.body;
  _validateName(name, false, (err) => {
    if(err)
      return res.validationError(err);
    
    _validateDescription(description, (err) => {
      if(err)
        return res.validationError(err);
      
      _validatePrivate(isPrivate, (err) => {
        if(err)
          return res.validationError(err);

        next();
      });
    });
  });
};

const getAll = (req, res, next) => {
  const queryStringInput = req.query;
  const countQueryArgs = {isActive: true};
  validatePaginationInput(
    Project,
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

const projectIdSlug = (req, res, next) => {
  const projectId = req.params.projectId.toLowerCase();
  if(!mongoose.Types.ObjectId.isValid(projectId))
    return res.validationError("project id is not valid");

  const getQueryArgs = {
    _id: projectId,
    isActive: true
  };
  const notFoundMsg = "requested project not found";
  const queryOptions = {};
  getOneWithSlug(
    Project,
    getQueryArgs,
    notFoundMsg,
    queryOptions,
    (err, project) => {
      if(err && err.code)
        return res.fatalError(err);
      else if(err)
        return res.notFoundError(err);
      
      req.project = project;
      next();
    }
  );
};

const update = (req, res, next) => {
  const { name, description, isPrivate } = req.body;
  if(isMissing(name) && isMissing(description) && isMissing(isPrivate))
    return res.validationError("request contains no update input");
  
  _validateName(name, true, (err) => {
    if(err)
      return res.validationError(err);
    
    _validateDescription(description, (err) => {
      if(err)
        return res.validationError(err);
      
      _validatePrivate(isPrivate, (err) => {
        if(err)
          return res.validationError(err);
        
        next();
      });
    });
  });
};

const remove = (req, res, next) => {
  const confirm = req.body.confirm;
  const project = req.project;
  validateConfirmString(project, "name", confirm, (err) => {
    if(err)
      return res.validationError(err);
    
    next();
  });
};

export default {
  create,
  getAll,
  projectIdSlug,
  update,
  remove
};
