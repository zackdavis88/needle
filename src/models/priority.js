import mongoose from "mongoose";

const prioritySchema = mongoose.Schema({
  project: {type: mongoose.Schema.Types.ObjectId, ref: "Project"},
  name: {type: String, unique: true},
  color: String,
  createdOn: Date,
  updatedOn: Date
});

export default mongoose.model("Priority", prioritySchema);
