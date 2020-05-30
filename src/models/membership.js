import mongoose from "mongoose";

const membershipSchema = mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  project: {type: mongoose.Schema.Types.ObjectId, ref: "Project"},
  roles: {
    isAdmin: {type: Boolean, default: false},
    isManager: {type: Boolean, default: false},
    isDeveloper: {type: Boolean, default: false},
    isViewer: {type: Boolean, default: true}
  },
  createdOn: Date,
  updatedOn: Date
});

export default mongoose.model("Membership", membershipSchema);
