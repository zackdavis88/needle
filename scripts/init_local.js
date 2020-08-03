/*
  *****THIS SCRIPT IS FOR LOCAL ENVIRONMENT USE ONLY*****
  --------------------------------------------------------------------------
  When doing local testing on the UI it is extremely helpful to have the db
  populated with data so that the I can develop for various scenarios.
*/
import mongoose from "mongoose";
import { 
  dbHost,
  dbPort,
  dbName,
  options 
} from "../config/db";
const databaseUrl = `mongodb://${dbHost}:${dbPort}/${dbName}`;
import User from "../src/models/user";
import Project from "../src/models/project";
import Membership from "../src/models/membership";
import Story from "../src/models/story";

const _randomString = (length) => {
  let result = "";
  const validCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = validCharacters.length;
  for(let i=0;i<length;i++) {
    result += validCharacters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const _removeAllCollections = (callback) => {
  User.deleteMany({}, err => {
    if(err) return console.err(err);
    Project.deleteMany({}, err => {
      if(err) return console.err(err);
      Membership.deleteMany({}, err => {
        if(err) return console.err(err);
        Story.deleteMany({}, err => {
          if(err) return console.err(err);
          console.log("All Documents Purged");
          callback();
        });
      });
    });
  });
};

// Note: This is the primary user to be logging in with locally.
const _createLocalUser = (callback) => {
  User.generateHash("Password1", (err, hash) => {
    if(err) return console.err(err);
    User.create({
      username: "booya",
      displayName: "booya",
      hash,
      apiKey: User.generateKey(),
      isActive: true,
      createdOn: new Date()
    },
    (err, user) => {
      if(err) return console.err(err);
      console.log("Created Local User")
      callback(user);
    })
  });
};

const _generateCompassProject = (user, callback) => {
  Project.create({
    name: "Compass",
    description: "This app.",
    isPrivate: true,
    isActive: true,
    createdOn: new Date()
  },
  (err, project) => {
    if(err) return console.err(err);
    
    Membership.create({
      project: project._id,
      user: user._id,
      roles: { isAdmin: true },
      createdOn: new Date()
    },
    (err) => {
      if(err) return console.err(err);
      console.log("Created Compass Project");
      callback(project);
    })
  });
};

const _generateUsers = (genAmount, callback, currentList=[]) => {
  if(currentList.length === genAmount)
    return callback(currentList);

  User.generateHash("Password2", (err, hash) => {
    if(err)
      console.err(err);
    else {
      const displayName = _randomString(7);
      User.create({
        username: displayName.toLowerCase(),
        displayName,
        hash,
        apiKey: User.generateKey(),
        isActive: true,
        createdOn: new Date()
      },
      (err, user) => {
        if(err)
          console.err(err);
        else
          _generateUsers(genAmount, callback, currentList.concat(user));
      });
    }
  });
};

const _generateProject = (user, roles, isPrivate, callback, name) => {
  Project.create({
    name: _randomString(Math.floor(Math.random() * (14 - 1) + 1)),
    description: _randomString(Math.floor(Math.random() * (350 - 0) + 0)),
    isPrivate,
    isActive: true,
    createdOn: new Date()
  },
  (err, project) => {
    if(err) return console.err(err);
    Membership.create({
      project: project._id,
      user: user._id,
      roles,
      createdOn: new Date()
    },
    err => {
      if(err) return console.err(err);
      callback(project);
    });
  });
};

const _generateMemberships = (genAmount, userList, project, callback, iteration=0) => {
  const validRoles = ["isAdmin", "isManager", "isDeveloper", "isViewer"];
  if(iteration === genAmount)
    return callback();
  
  const randomRole = Math.floor(Math.random() * (5 - 0) + 0);
  Membership.create({
    project: project._id,
    user: userList[iteration]._id,
    roles: {
      [validRoles[randomRole]]: true
    },
    createdOn: new Date()
  },
  (err) => {
    if(err)
      console.err(err);
    else
      _generateMemberships(genAmount, userList, project, callback, iteration+1);
  });
};

console.log("Initializing Local DB...");
mongoose.connect(databaseUrl, options);
mongoose.connection.once("open", () => {
  console.log("...done")
  // Purge the database.
  _removeAllCollections(() => {
    // Create the local user.
    _createLocalUser(localUser => {
      // Generate Compass project.
      _generateCompassProject(localUser, compassProject => {
        // Generate the filler users.
        console.log(`Generating 100 Users...`);
        _generateUsers(100, userList => {
          console.log("...done");
          // Generate a project with localUser as manager.
          _generateProject(localUser, {isManager: true}, true, managerProject => {
            console.log("Created Project With Manager Permissions");
            // Generate a project with localUser as developer.
            _generateProject(localUser, {isDeveloper: true}, true, developerProject => {
              console.log("Created Project With Developer Permissions");
              // Generate a project with localUser as viewer.
              _generateProject(localUser, {isViewer: true}, false, viewerProject => {
                console.log("Created Project With Viewer Permissions");
                // Generate a public project that localUser is not a member of.
                _generateProject(userList[0], {isAdmin: true}, false, nonmemberPublicProject => {
                  console.log("Created Public Project With No Membership");
                  // Generate a private project that localUser is not a member of.
                  _generateProject(userList[1], {isAdmin: true}, true, nonmemberPrivateProject => {
                    console.log("Created Private Project With No Membership");
                    console.log("Generating 61 Memberships For Compass Project...");
                    _generateMemberships(61, userList, compassProject, () => {
                      console.log("...done");
                      //TODO: Create some dummy test data for stories once the UI is that far into development.
                      console.log("Local DB Initialized!");
                      mongoose.disconnect();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
