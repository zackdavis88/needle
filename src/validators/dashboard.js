import Project from "../models/project";
import Membership from "../models/membership";
import Story from "../models/story";
import { 
  validatePaginationInput
} from "../utils/validator";

const getProjects = (req, res, next) => {
  const {user, query} = req;
  Membership
    .find({user: user._id})
    .distinct("project")
    .exec((err, projectIds) => {
      if(err)
        return res.fatalError(err);
      
      const countQueryArgs = {_id: {$in: projectIds}, isActive: true};
      validatePaginationInput(
        Project,
        countQueryArgs,
        query,
        (err, paginationData) => {
          if(err)
            return res.fatalError(err);
          
          req.memberProjects = projectIds;
          req.paginationData = paginationData;
          next();
        }
      );
    });
};

const getStories = (req, res, next) => {
  const {user, query} = req;
  Membership
    .find({user: user._id})
    .distinct("project")
    .exec((err, memberProjects) => {
      if(err)
        return res.fatalError(err);

      Project
        .find({_id: {$in: memberProjects}, isActive: true})
        .distinct("_id")
        .exec((err, activeMemberProjects) => {
          if(err)
            return res.fatalError(err);

          const countQueryArgs = {
            $and: [
              {$or: [
                {owner: user._id},
                {creator: user._id}
              ]},
              {project: {$in: activeMemberProjects}}
            ]
          };
          
          validatePaginationInput(
            Story,
            countQueryArgs,
            query,
            (err, paginationData) => {
              if(err)
                return res.fatalError(err);
              
              req.memberProjects = activeMemberProjects;
              req.paginationData = paginationData;
              next();
            }
          );
        });
    });
};

export default {
  getProjects,
  getStories
};
