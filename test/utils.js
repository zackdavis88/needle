import jwt from "jsonwebtoken";
import User from "../src/models/user";
import Project from "../src/models/project";
import Membership from "../src/models/membership";
import Story from "../src/models/story";
import Status from "../src/models/status";
import Priority from "../src/models/priority";
import { secret } from "../config/auth";
import mongoose from "mongoose";
let cleanupUsernames = [];
let cleanupProjectIds = [];

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

export const createTestProject = (isPrivate, user, callback) => {
  const randomName = mongoose.Types.ObjectId().toString();
  const testProject = {
    name: randomName,
    description: "Created via unit test automation",
    isPrivate: isPrivate || false,
    isActive: true,
    createdOn: new Date()
  };
  Project.create(testProject, (err, project) => {
    if(err)
      return console.error(err);

    const testMembership = {
      project: project._id,
      user: user._id,
      roles: {
        isAdmin: true
      },
      createdOn: new Date()
    };
    Membership.create(testMembership, (err, membership) => {
      if(err)
        return console.error(err);
      
      addProjectIdForCleanup(project._id.toString());
      callback(project, membership);
    });
  });
};

export const createTestMembership = (project, user, roles, callback) => {
  const testMembership = {
    project: project._id,
    user: user._id,
    roles,
    createdOn: new Date()
  };
  Membership.create(testMembership, (err, membership) => {
    if(err)
      return console.error(err);

    callback(membership);
  });
};

export const createTestStory = (project, creator, owner=null, priority=null, callback) => {
  const randomName = mongoose.Types.ObjectId().toString();
  const testStory = {
    name: randomName,
    details: "Created via unit test automation",
    creator: creator._id,
    project: project._id,
    owner: owner ? owner._id : null,
    points: Math.floor(Math.random() * 10) + 1, // Random number between 1 - 10.
    priority: priority ? priority._id : null,
    createdOn: new Date()
  };
  Story.create(testStory, (err, story) => {
    if(err)
      return console.error(err);
    
    callback(story);
  }); 
};

export const createTestStatus = (project, callback) => {
  const randomName = mongoose.Types.ObjectId().toString();
  const testStatus = {
    project: project._id,
    name: randomName,
    createdOn: new Date()
  };
  Status.create(testStatus, (err, status) => {
    if(err)
      return console.error(err);
    
    callback(status);
  });
};

export const createTestPriority = (project, callback) => {
  const randomName = mongoose.Types.ObjectId().toString();
  const testPriority = {
    project: project._id,
    name: randomName,
    createdOn: new Date()
  };
  Priority.create(testPriority, (err, priority) => {
    if(err)
      return console.error(err);
    
    callback(priority);
  });
};

export const getTestUser = (username, callback) => {
  User.findOne({username: username.toLowerCase()}, (err, user) => {
    if(err)
      return console.error(err);
    
    callback(user);
  });
};

export const getTestMembership = (projectId, userId, callback) => {
  Membership.findOne({project: projectId, user: userId}, (err, membership) => {
    if(err)
      return console.error(err);
    
    callback(membership);
  });
};

export const cleanupTestRecords = (callback) => {
  cleanupTestUsers(() => {
    cleanupTestProjects(callback);
  });
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

const cleanupTestProjects = (callback) => {
  if(!cleanupProjectIds.length)
    return callback();
  
  cleanupProjectIds.forEach((_id, index, array) => {
    Membership.deleteMany({project: _id}, (err) => {
      if(err)
        return console.error(err);

      Story.deleteMany({project: _id}, (err) => {
        if(err)
          return console.error(err);

        Status.deleteMany({project: _id}, (err) => {
          if(err)
            return console.error(err);

          Priority.deleteMany({project: _id}, (err) => {
            if(err)
              return console.error(err);
            
            Project.deleteOne({_id}, (err) => {
              if(err)
                return console.error(err);
              
              if(index === array.length - 1){
                cleanupProjectIds = [];
                return callback();
              }
            });
          });
        });
      });
    });
  });
};

export const addUsernameForCleanup = (username) => {
  cleanupUsernames.push(username.toLowerCase());
  return;
};

export const addProjectIdForCleanup = (projectId) => {
  cleanupProjectIds.push(projectId);
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
