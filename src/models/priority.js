import mongoose from "mongoose";

const prioritySchema = mongoose.Schema({
  project: {type: mongoose.Schema.Types.ObjectId, ref: "Project"},
  name: {type: String, unique: true},
  color: String,
  transparent: Boolean,
  createdOn: Date,
  updatedOn: Date
});

export default mongoose.model("Priority", prioritySchema);
