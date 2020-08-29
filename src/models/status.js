import mongoose from "mongoose";

const statusSchema = mongoose.Schema({
  project: {type: mongoose.Schema.Types.ObjectId, ref: "Project"},
  name: {type: String, unique: true},
  color: String,
  createdOn: Date,
  updatedOn: Date
});

export default mongoose.model("Status", statusSchema);
