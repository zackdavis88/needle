import Membership from "../models/membership";
import User from "../models/user";

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
    .populate("user", "-_id username displayName isActive")
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
        memberships: memberships.reduce((prev, curr) => {
          if(curr.user.isActive) {
            return prev.concat({
              id: curr._id,
              user: {
                username: curr.user.username,
                displayName: curr.user.displayName
              },
              roles: curr.roles,
              createdOn: curr.createdOn,
              updatedOn: curr.updatedOn
            })
          }
          return prev;
        }, [])
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

const update = (req, res) => {
  const { membership, project } = req;
  const { roles } = req.body;
  membership.roles = {...membership.roles, ...roles};
  membership.updatedOn = new Date();
  membership.save((err, updatedMembership) => {
    if(err)
      return res.fatalError(err);
    
    const membershipData = {
      id: updatedMembership._id,
      project: {
        id: project._id,
        name: project.name
      },
      user: membership.user,
      roles: updatedMembership.roles,
      createdOn: updatedMembership.createdOn,
      updatedOn: updatedMembership.updatedOn
    };

    return res.success("membership has been successfully updated", {membership: membershipData});
  });
};

const remove = (req, res) => {
  const { membership } = req;
  membership.remove(err => {
    if(err)
      return res.fatalError(err);
    
    return res.success("membership has been successfully deleted");
  });
};

/* Since you cannot Create a membership for a user that already has a membership, it would be very useful
   if the UI could receive a list of all available users that are NOT members already. */
const availableUsers = (req, res) => {
  const {project} = req;
  Membership
    .find({project: project._id})
    .sort({createdOn: "asc"})
    .distinct("user")
    .exec((err, memberships) => {
      if(err)
        return res.fatalError(err);

      User
        .find({_id: {$nin: memberships}, isActive: true})
        .sort({createdOn: "asc"})
        .distinct("displayName")
        .exec((err, users) => {
          if(err)
            return res.fatalError(err);
          
          return res.success("available users have been successfully retrieved", {users})
        });
    });
};

/* Since stories can be assigned to an owner, it would be helpful for the UI to have a method to call
   to get a full list of project member's usernames.
*/
const allMemberNames = (req, res) => {
  const {project} = req;
  Membership
    .find({project: project._id})
    .sort({createdOn: "asc"})
    .populate("user", "-_id displayName isActive")
    .exec((err, memberships) => {
      if(err)
        return res.fatalError(err);
      
      const users = memberships.reduce((prev, curr) => {
        if(!curr.user.isActive)
          return prev;
        
        return prev.concat(curr.user.displayName);
      }, []);

      return res.success("member names successfully retrieved", {users});
    });
};

export default {
  create,
  getAll,
  getOne,
  update,
  remove,
  availableUsers,
  allMemberNames
};
