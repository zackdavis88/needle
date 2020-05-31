import mongoose from "mongoose";

const storySchema = mongoose.Schema({
  name: String,
  details: String,
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  ownedBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  project: {type: mongoose.Schema.Types.ObjectId, ref: "Project"},
  createdOn: Date,
  updatedOn: Date
});

export default mongoose.model("Story", storySchema);
