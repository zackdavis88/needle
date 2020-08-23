import User from "../models/user";
import Membership from "../models/membership";
import Story from "../models/story";
import Priority from "../models/priority";
import mongoose from "mongoose";
import { 
  compareType, 
  isMissing, 
  validatePaginationInput, 
  getOneWithSlug,
  validateConfirmBoolean,
  escapeRegex
} from "../utils/validator";

const _validateName = (name, isOptional, callback) => {
  if(isOptional && isMissing(name))
    return callback();

  if(isMissing(name))
    return callback("name is missing from input");

  if(!compareType(name, "string"))
    return callback("name must be a string");

  if(name.length < 1 || name.length > 100)
    return callback("name must be 1 - 100 characters in length");

  const regex = new RegExp("^[A-Za-z0-9-_+=&^%$#*@!|\/(){}?.,<>;':\" ]+$");
  if(!regex.test(name))
    return callback("name contains invalid characters");

  callback();
};

const _validateDetails = (details, callback) => {
  if(isMissing(details))
    return callback();

  if(!compareType(details, "string"))
    return callback("details must be a string");

  if(details.length > 2000)
    return callback("details must be 2000 characters or less");
  
  callback();
};

const _validateOwner = (owner, project, callback) => {
  if(isMissing(owner))
    return callback();
  
  if(!compareType(owner, "string"))
    return callback("owner must be a string");

  if(owner.length === 0)
    return callback();
  
  const queryArgs = {username: owner.toLowerCase(), isActive: true};
  User.findOne(queryArgs, (err, user) => {
    if(err)
      return callback(err);
    
    if(!user)
      return callback("requested owner does not exist");
    
    Membership.findOne({project: project._id, user: user._id}, (err, membership) => {
      if(err)
        return callback(err);
      
      if(!membership)
        return callback("requested owner is not a member of this project");

      callback(null, user);
    });
  });
};

const _validatePoints = (points, callback) => {
  if(isMissing(points))
    return callback();
  
  if(!compareType(points, "number"))
    return callback("points must be a number");
  
  if(!Number.isInteger(points))
    return callback("points must be an integer");
  
  if(points < 0 || points > 100) //100 is an insane story point value...lets make that the cap for now.
    return callback("points must be between 0 - 100");

  callback();
};

const _validatePriority = (project, priorityName, callback) => {
  if(isMissing(priorityName))
    return callback();
  
  if(!compareType(priorityName, "string"))
    return callback("priority must be a string");
  
  if(priorityName.length === 0)
    return callback();

  Priority.findOne({
    project: project._id,
    name: {$regex: `^${priorityName}$`, $options: "i"}
  }, (err, priority) => {
    if(err)
      return callback(err);
    
    if(!priority)
      return callback("requested priority does not exist");
    
    callback(null, priority);
  });
};

const create = (req, res, next) => {
  const {
    name,
    details,
    owner,
    points,
    priority
  } = req.body;
  const { project } = req;
  _validateName(name, false, (err) => {
    if(err)
      return res.validationError(err);
    
    _validateDetails(details, (err) => {
      if(err)
        return res.validationError(err);
      
      _validateOwner(owner, project, (err, user) => {
        if(err && err.code)
          return res.fatalError(err);
        else if(err)
          return res.validationError(err);
        
        _validatePoints(points, (err) => {
          if(err)
            return res.validationError(err);

          _validatePriority(project, priority, (err, priority) => {
            if(err && err.code)
              return res.fatalError(err);
            else if(err)
              return res.validationError(err);
            
            req.requestedPriority = priority;
            req.owner = user;
            next();
          });
        });
      });
    });
  });
};

const getAll = (req, res, next) => {
  const { project, query } = req;
  const countQueryArgs = { project: project._id };
  if(query.filterName)
    countQueryArgs.name = {$regex: `^${escapeRegex(query.filterName)}`, $options: "i"};
  validatePaginationInput(
    Story,
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

const storyIdSlug = (req, res, next) => {
  const storyId = req.params.storyId.toLowerCase();
  const { project } = req;
  if(!mongoose.Types.ObjectId.isValid(storyId))
    return res.validationError("story id is not valid");
  
  const getQueryArgs = { project: project._id, _id: storyId };
  const notFoundMsg = "requested story not found";
  const queryOptions = {
    populate: {
      creator: "-_id username displayName",
      owner: "-_id username displayName",
      priority: "-_id name color"
    }
  };
  getOneWithSlug(
    Story,
    getQueryArgs,
    notFoundMsg,
    queryOptions,
    (err, story) => {
      if(err && err.code)
        return res.fatalError(err);
      else if(err)
        return res.notFoundError(err);
      
      req.story = story;
      next();
    }
  );
};

const update = (req, res, next) => {
  const { name, details, owner, points, priority } = req.body;
  const { project } = req;
  if(isMissing(name) && isMissing(details) && isMissing(owner) && isMissing(priority))
    return res.validationError("request contains no update input");
  
  _validateName(name, true, (err) => {
    if(err)
      return res.validationError(err);
    
    _validateDetails(details, (err) => {
      if(err)
        return res.validationError(err);

      _validateOwner(owner, project, (err, user) => {
        if(err && err.code)
          return res.fatalError(err);
        else if(err)
          return res.validationError(err);

        _validatePoints(points, (err) => {
          if(err)
            return res.validationError(err);

          _validatePriority(project, priority, (err, priority) => {
            if(err && err.code)
              return res.fatalError(err);
            else if(err)
              return res.validationError(err);
            
            req.requestedPriority = priority;
            req.owner = user;
            next();
          })
        });
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
  storyIdSlug,
  update,
  remove
};
