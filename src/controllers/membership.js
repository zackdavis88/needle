import Membership from "../models/membership";

const create = (req, res) => {
  const { member, project } = req;
  const roles = req.body.roles;
  Membership.create({
    project: project._id,
    user: member._id,
    roles,
    createdOn: new Date()
  }, (err, membership) => {
    if(err)
      return res.fatalError(err);
    
    const membershipData = {
      id: membership._id,
      user: {
        username: member.username,
        displayName: member.displayName
      },
      project: membership.project,
      roles: membership.roles,
      createdOn: membership.createdOn
    };

    res.success("membership has been successfully created", {membership: membershipData});
  })
};

export default {
  create
};
