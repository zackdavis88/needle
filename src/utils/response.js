const fatalError = (res) => {
  return (message) => {
    res.statusCode = 500;
    return res.json({fatalError: message})
  };
}

const validationError = (res) => {
  return (message) => {
    res.statusCode = 400;
    return res.json({error: message});
  };
};

const notFoundError = (res) => {
  return (message) => {
    res.statusCode = 404;
    return res.json({error: message})
  };
};

const authenticationError = (res) => {
  return (message) => {
    res.statusCode = 403;
    return res.json({error: message})
  };
};

const authorizationError = (res) => {
  return (message) => {
    res.statusCode = 401;
    return res.json({error: message})
  };
};

const success = (res) => {
  return (message, data={}) => {
    res.statusCode = 200;
    return res.json({message, ...data});
  };
};

export const setResponseHandlers = (res) => {
  res.fatalError = fatalError(res);
  res.validationError = validationError(res);
  res.notFoundError = notFoundError(res);
  res.authenticationError = authenticationError(res);
  res.authorizationError = authorizationError(res);
  res.success = success(res);
};
