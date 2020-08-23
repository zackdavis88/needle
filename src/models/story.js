import mongoose from "mongoose";

const storySchema = mongoose.Schema({
  name: String,
  details: String,
  creator: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  owner: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  project: {type: mongoose.Schema.Types.ObjectId, ref: "Project"},
  priority: {type: mongoose.Schema.Types.ObjectId, ref: "Priority"},
  points: Number,
  createdOn: Date,
  updatedOn: Date
});

export default mongoose.model("Story", storySchema);
