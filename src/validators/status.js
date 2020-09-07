import Status from "../models/status";
import { 
  compareType, 
  isMissing, 
  validatePaginationInput, 
  getOneWithSlug,
  validateConfirmBoolean,
  validateColor,
  validateTransparent,
  escapeRegex
} from "../utils/validator";
import mongoose from "mongoose";

const _validateName = (project, name, {isOptional, status}, callback) => {
  if(isOptional && isMissing(name))
    return callback();

  if(isMissing(name))
    return callback("name is missing from input");

  if(!compareType(name, "string"))
    return callback("name must be a string");

  if(name.length < 1 || name.length > 26)
    return callback("name must be 1 - 26 characters in length");

  const regex = new RegExp("^[A-Za-z0-9-_+=&^%$#*@!|\/(){}?.,<>;':\" ]+$");
  if(!regex.test(name))
    return callback("name contains invalid characters");

  const queryArgs = {
    project: project._id,
    name: {$regex: `^${escapeRegex(name)}$`, $options: "i"}
  };
  
  if(status)
    queryArgs._id = {$nin: [status._id]};

  Status.findOne(queryArgs, (err, status) => {
    if(err)
      return callback(err);
    
    if(status)
      return callback("name is already taken");
    
    callback();
  });
};

const create = (req, res, next) => {
  const {project} = req;
  const {name, color, transparent} = req.body;
  _validateName(project, name, {isOptional: false}, err => {
    if(err && err.code)
      return res.fatalError(err);
    else if(err)
      return res.validationError(err);

    validateColor(color, (err) => {
      if(err)
        return res.validationError(err);

      validateTransparent(transparent, (err) => {
        if(err)
          return res.validationError(err);
        
        next();
      });
    });
  });
};

const getAll = (req, res, next) => {
  const { project, query } = req;
  const countQueryArgs = { project: project._id };
  validatePaginationInput(
    Status,
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

const statusIdSlug = (req, res, next) => {
  const statusId = req.params.statusId.toLowerCase();
  const { project } = req;
  if(!mongoose.Types.ObjectId.isValid(statusId))
    return res.validationError("status id is not valid");
  
  const getQueryArgs = { project: project._id, _id: statusId };
  const notFoundMsg = "requested status not found";
  const queryOptions = {};
  getOneWithSlug(
    Status,
    getQueryArgs,
    notFoundMsg,
    queryOptions,
    (err, status) => {
      if(err && err.code)
        return res.fatalError(err);
      else if(err)
        return res.notFoundError(err);
      
      req.projectStatus = status;
      next();
    }
  );
};

const update = (req, res, next) => {
  const {project, projectStatus} = req;
  const {name, color, transparent} = req.body;

  _validateName(project, name, {isOptional: true, status: projectStatus}, err => {
    if(err && err.code)
      return res.fatalError(err);
    else if(err)
      return res.validationError(err);

    validateColor(color, (err) => {
      if(err)
        return res.validationError(err);

      validateTransparent(transparent, (err) => {
        if(err)
          return res.validationError(err);
        
        next();
      });
    });
  });
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
  statusIdSlug,
  update,
  remove
};
