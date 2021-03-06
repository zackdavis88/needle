const NULL_TYPE = Object.prototype.toString.call(null);
const UNDEFINED_TYPE = Object.prototype.toString.call(undefined);

export const isMissing = (inputValue) => {
  const inputType = Object.prototype.toString.call(inputValue);
  return (
    inputType.toLowerCase() === NULL_TYPE.toLowerCase() ||
    inputType.toLowerCase() === UNDEFINED_TYPE.toLowerCase()
  ); 
};

export const compareType = (inputValue, expectedType) => {
  const inputType = Object.prototype.toString.call(inputValue);
  expectedType = `[object ${expectedType}]`;
  return inputType.toLowerCase() === expectedType.toLowerCase();
};

export const validatePaginationInput = (model, countQueryArgs, queryStringInput, callback) => {
  model.countDocuments(countQueryArgs, (err, count) => {
    if(err)
      return callback(err);
    
    let itemsPerPage = require("../../config/app").itemsPerPage || 10;
    const ippInput = queryStringInput.itemsPerPage;
    if(ippInput && !isNaN(ippInput) && Number.isInteger(Number(ippInput)) && ippInput > 0)
      itemsPerPage = Number(ippInput);

    const totalPages = Math.ceil(count / itemsPerPage);
    let page = Number(queryStringInput.page);
    if(isNaN(page) || !Number.isInteger(Number(page)) || page <= 0)
      page = 1;
    else if(page > totalPages) // If the page is greater than the limit. set it to the limit.
      page = totalPages ? totalPages : 1;
    
    const pageOffset = (page - 1) * itemsPerPage;
    const paginationData = {
      page,
      totalPages,
      itemsPerPage,
      pageOffset
    };

    callback(null, paginationData);
  });
};

export const getOneWithSlug = (model, queryArgs, errMessage, options={}, callback) => {
  const dbQuery = model.findOne(queryArgs);
  if(options && options.populate){
    for(const key in options.populate){
      dbQuery.populate(key, options.populate[key]);
    }
  }
  dbQuery.exec((err, modelInstance) => {
    if(err)
      return callback(err);
    
    if(!modelInstance)
      return callback(errMessage);
    
    callback(null, modelInstance);
  });
};

export const validateConfirmString = (modelInstance, key, inputValue, callback) => {
  if(isMissing(inputValue))
    return callback("confirm is missing from input");
  
  if(!compareType(inputValue, "string"))
    return callback("confirm must be a string");

  const value = modelInstance[key];
  if(value !== inputValue)
    return callback(`confirm input must match ${key}: ${value}`);
  
  callback();
};

export const validateConfirmBoolean = (inputValue, callback) => {
  if(isMissing(inputValue))
    return callback("confirm is missing from input");
  
  if(!compareType(inputValue, "boolean"))
    return callback("confirm must be a boolean");
  
  if(!inputValue)
    return callback("confirm must be set to true to remove this record");

  callback();
};

// Stolen from stackoverflow. Escapes special characters in a string before performing a Mongoose regex search.
// https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
export const escapeRegex = (string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export const validateColor = (color, callback) => {
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

export const validateTransparent = (transparent, callback) => {
  if(isMissing(transparent))
    return callback();
  
  if(!compareType(transparent, "boolean"))
    return callback("transparent must be a boolean");
  
  return callback();
};
