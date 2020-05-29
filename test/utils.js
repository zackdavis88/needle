import jwt from "jsonwebtoken";
import User from "../src/models/user";
import { secret } from "../config/auth";
import mongoose from "mongoose";
let cleanupUsernames = [];

export const createTestUser = (password, callback) => {
  User.generateHash(password, (err, hash) => {
    if(err)
      return console.error(err);
    
    const randomUsername = mongoose.Types.ObjectId().toString();
    const testUser = {
      username: randomUsername.toLowerCase(),
      displayName: randomUsername.toUpperCase(),
      hash,
      apiKey: User.generateKey(),
      isActive: true,
      createdOn: new Date()
    };

    User.create(testUser, (err, user) => {
      if(err)
        return console.error(err);
      
      addUsernameForCleanup(user.username);
      callback(user);
    });
  });
};

export const getTestUser = (username, callback) => {
  User.findOne({username: username.toLowerCase()}, (err, user) => {
    if(err)
      return console.error(err);
    
    callback(user);
  });
};

export const cleanupTestRecords = (callback) => {
  cleanupTestUsers(callback);
};

const cleanupTestUsers = (callback) => {
  if(!cleanupUsernames.length)
    return callback();
  
  cleanupUsernames.forEach((username, index, array) => {
    User.deleteOne({username: username}, (err) => {
      if(err)
        return console.error(err);
      
      if(index === array.length - 1){
        cleanupUsernames = [];
        return callback();
      }
    });
  });
};

export const addUsernameForCleanup = (username) => {
  cleanupUsernames.push(username.toLowerCase());
  return;
};

export const generateToken = (user, dataOverride={}, secretOverride=undefined) => {
  let tokenData = {
    _id: user._id,
    apiKey: user.apiKey,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60*60*3)
  };
  tokenData = {...tokenData, ...dataOverride};
  const token = jwt.sign(tokenData, secretOverride || secret);
  return token;
};
