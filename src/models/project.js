import mongoose from "mongoose";

const projectSchema = mongoose.Schema({
  name: String,
  description: String,
  isPrivate: Boolean,
  isActive: Boolean,
  createdOn: Date,
  updatedOn: Date,
  deletedOn: Date
});

export default mongoose.model("Project", projectSchema);
