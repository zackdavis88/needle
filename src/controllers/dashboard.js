import Membership from "../models/membership";
import Story from "../models/story";
import Project from "../models/project";
import {escapeRegex} from "../utils/validator";

const getProjects = (req, res) => {
  const {user, memberProjects} = req;
  const {
    page,
    totalPages,
    itemsPerPage
  } = req.paginationData;
  const pageOffset = (page - 1) * itemsPerPage;
  const queryArgs = {_id: {$in: memberProjects}, isActive: true};
  if(req.query.filterName)
    queryArgs.name = {$regex: `^${escapeRegex(req.query.filterName)}`, $options: "i"}
  Project
    .find(queryArgs)
    .sort({createdOn: "asc"})
    .select("-description -isActive")
    .skip(pageOffset)
    .limit(itemsPerPage)
    .exec((err, projects) => {
      if(err)
        return res.fatalError(err);
      
      const projectIds = projects.map(project => project._id);
      Membership.find({user: user._id, project: {$in: projectIds}}, (err, memberships) => {
        if(err)
          return res.fatalError(err);
        
        const result = {
          page,
          totalPages,
          itemsPerPage,
          projects: projects.map(project => ({
            id: project._id,
            name: project.name,
            isPrivate: project.isPrivate,
            createdOn: project.createdOn,
            updatedOn: project.updatedOn,
            roles: memberships.find(membership => membership.project.toString() === project._id.toString()).roles
          }))
        };

        res.success("dashboard projects successfully retrieved", result);
      });
    });
};

const getStories = (req, res) => {
  const {user, memberProjects, query} = req;
  const {
    page,
    totalPages,
    itemsPerPage
  } = req.paginationData;
  const pageOffset = (page - 1) * itemsPerPage;
  const queryArgs = {
    $and: [
      {$or: [
        {owner: user._id},
        {creator: user._id}
      ]},
      {project: {$in: memberProjects}}
    ]
  };
  if(query.filterName)
    queryArgs.name = {$regex: `^${escapeRegex(query.filterName)}`, $options: "i"}
  Story
    .find(queryArgs)
    .populate("creator", "-_id username displayName")
    .populate("owner", "-_id username displayName")
    .populate("project", "-description")
    .populate("priority", "-_id name color transparent")
    .populate("status", "-_id name color transparent")
    .sort({createdOn: "asc"})
    .skip(pageOffset)
    .limit(itemsPerPage)
    .exec((err, stories) => {
      if(err)
        return res.fatalError(err);
      
      const result = {
        page,
        itemsPerPage,
        totalPages,
        stories: stories.map(story => ({
          id: story._id,
          name: story.name,
          creator: story.creator,
          owner: story.owner,
          project: {
            id: story.project._id,
            name: story.project.name
          },
          points: story.points,
          priority: story.priority,
          status: story.status,
          createdOn: story.createdOn,
          updatedOn: story.updatedOn
        }))
      };

      res.success("dashboard stories successfully retrieved", result);
    });
};

export default {
  getProjects,
  getStories
};
