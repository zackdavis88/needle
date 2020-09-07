import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuid} from "uuid";
import { saltRounds } from "../../config/app";

const userSchema = mongoose.Schema({
  username: {type: String, unique: true},
  displayName: String,
  hash: String,
  apiKey: String,
  isActive: Boolean,
  createdOn: Date,
  updatedOn: Date,
  deletedOn: Date
});

// Used to generate a unique apiKey for a User during creation.
userSchema.statics.generateKey = () => uuid().toString();

// Used to generate a hashed password for a User.
userSchema.statics.generateHash = (password, callback) => {
  bcrypt.genSalt(saltRounds || 10, (err, salt) => {
    if(err)
      return callback(err);
    
    bcrypt.hash(password, salt, (err, hash) => {
      if(err)
        return callback(err);
      
      callback(null, hash);
    });
  });
};

// // Used to compare password input to a User hash.
userSchema.statics.compareHash = (password, hash, callback) => {
  bcrypt.compare(password, hash, (err, result) => {
    if(err)
      return callback(err);
    
    callback(null, result);
  });
};

export default mongoose.model("User", userSchema);
