import mongoose from "mongoose";

const prioritySchema = mongoose.Schema({
  project: {type: mongoose.Schema.Types.ObjectId, ref: "Project"},
  name: String,
  color: String,
  transparent: Boolean,
  createdOn: Date,
  updatedOn: Date
});

export default mongoose.model("Priority", prioritySchema);
