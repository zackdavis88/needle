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

const getAll = (req, res) => {
  const { project } = req;
  const {
    page,
    totalPages,
    itemsPerPage
  } = req.paginationData;
  const pageOffset = (page - 1) * itemsPerPage;
  Membership
    .find({project: project._id})
    .sort({createdOn: "asc"})
    .populate("user", "-_id username displayName")
    .skip(pageOffset)
    .limit(itemsPerPage)
    .exec((err, memberships) => {
      if(err)
        return res.fatalError(err);
      
      const result = {
        page,
        totalPages,
        itemsPerPage,
        project: {
          id: project._id,
          name: project.name
        },
        memberships: memberships.map(membership => ({
          id: membership._id,
          user: membership.user,
          roles: membership.roles,
          createdOn: membership.createdOn,
          updatedOn: membership.updatedOn
        }))
      };

      return res.success("membership list has been successfully retrieved", result);
    });
};

const getOne = (req, res) => {
  const { membership, project } = req;
  const membershipData = {
    id: membership._id,
    project: {
      id: project._id,
      name: project.name
    },
    user: membership.user,
    roles: membership.roles,
    createdOn: membership.createdOn,
    updatedOn: membership.updatedOn
  };
  return res.success("membership has been successfully retrieved", {membership: membershipData});
};

export default {
  create,
  getAll,
  getOne
};
