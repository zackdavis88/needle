import Priority from "../models/priority";
import { 
  compareType, 
  isMissing, 
  validatePaginationInput, 
  getOneWithSlug,
  validateConfirmBoolean
} from "../utils/validator";
import mongoose from "mongoose";

const _validateName = (project, name, {isOptional, priority}, callback) => {
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
    name: {$regex: `^${name}$`, $options: "i"}
  };
  
  // if a priority was passed to this function it means we are updating a priority.
  // when checking if the name exists, lets ignore the priority we are updating.
  if(priority)
    queryArgs._id = {$nin: [priority._id]};

  Priority.findOne(queryArgs, (err, priority) => {
    if(err)
      return callback(err);
    
    if(priority)
      return callback("name is already taken");
    
    callback();
  });
};

const _validateColor = (color, callback) => {
  if(isMissing(color))
    return callback();
  
  if(!compareType(color, "string"))
    return callback("color must be a string");
  
  if(color.length === 0)
    return callback();
  
  const regex = new RegExp("^#[0-9A-Fa-f]{6}$");
  if(!regex.test(color))
    return callback("color has invalid format. example #000000");
  
  callback();
};

const create = (req, res, next) => {
  const {project} = req;
  const {name, color} = req.body;
  _validateName(project, name, {isOptional: false}, err => {
    if(err && err.code)
      return res.fatalError(err);
    else if(err)
      return res.validationError(err);

    _validateColor(color, (err) => {
      if(err)
        return res.validationError(err);

      next();
    });
  });
};

const getAll = (req, res, next) => {
  const { project, query } = req;
  const countQueryArgs = { project: project._id };
  validatePaginationInput(
    Priority,
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

const priorityIdSlug = (req, res, next) => {
  const priorityId = req.params.priorityId.toLowerCase();
  const { project } = req;
  if(!mongoose.Types.ObjectId.isValid(priorityId))
    return res.validationError("priority id is not valid");
  
  const getQueryArgs = { project: project._id, _id: priorityId };
  const notFoundMsg = "requested priority not found";
  const queryOptions = {};
  getOneWithSlug(
    Priority,
    getQueryArgs,
    notFoundMsg,
    queryOptions,
    (err, priority) => {
      if(err && err.code)
        return res.fatalError(err);
      else if(err)
        return res.notFoundError(err);
      
      req.projectPriority = priority;
      next();
    }
  );
};

const update = (req, res, next) => {
  const {project, projectPriority} = req;
  const {name, color} = req.body;

  _validateName(project, name, {isOptional: true, priority: projectPriority}, err => {
    if(err && err.code)
      return res.fatalError(err);
    else if(err)
      return res.validationError(err);

    _validateColor(color, (err) => {
      if(err)
        return res.validationError(err);

      next();
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
  priorityIdSlug,
  update,
  remove
};
