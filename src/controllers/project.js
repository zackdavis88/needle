import Project from "../models/project";
import Membership from "../models/membership";
import Story from "../models/story";

const create = (req, res) => {
  const { name, description, isPrivate } = req.body;
  const user = req.user;
  Project.create({
    name,
    description: description && description.length ? description : "",
    isPrivate: !!isPrivate,
    isActive: true,
    createdOn: new Date(),
  },
  (err, project) => {
    if(err)
      return res.fatalError(err);
    
    // Create a new membership. The user that created this project is admin-level by default.
    Membership.create({
      user: user._id,
      project: project._id,
      roles: { isAdmin: true },
      createdOn: new Date()
    },
    (err) => {
      if(err)
        return res.fatalError(err);

      const projectData = {
        id: project._id,
        name: project.name,
        description: project.description,
        isPrivate: project.isPrivate,
        createdOn: project.createdOn
      };
  
      return res.success("project has been successfully created", {project: projectData});
    });
  });
};

const getAll = (req, res) => {
  const {
    page,
    totalPages,
    itemsPerPage
  } = req.paginationData;
  const pageOffset = (page - 1) * itemsPerPage;
  Project
    .find({isActive: true})
    .sort({createdOn: "asc"})
    .skip(pageOffset)
    .limit(itemsPerPage)
    .exec((err, projects) => {
      if(err)
        return res.fatalError(err);
      
      const result = {
        page,
        totalPages,
        itemsPerPage,
        projects: projects.map((project) => ({
          id: project._id,
          name: project.name,
          isPrivate: project.isPrivate,
          createdOn: project.createdOn
        }))
      };

      return res.success("project list has been successfully retrieved", result);
    });
};

const getOne = (req, res) => {
  const includeStatistics = req.query.includeStatistics && req.query.includeStatistics === "true";
  const project = req.project;
  const projectData = {
    id: project._id,
    name: project.name,
    description: project.description,
    isPrivate: project.isPrivate,
    createdOn: project.createdOn,
    updatedOn: project.updatedOn
  };

  if(includeStatistics){
    Membership.countDocuments({project: project._id}, (err, membershipCount) => {
      if(err)
        return res.fatalError(err);
      
      Story.countDocuments({project: project._id}, (err, storyCount) => {
        if(err)
          return res.fatalError(err);
        
        projectData.statistics = {
          memberships: membershipCount,
          stories: storyCount
        };
        
        return res.success("project has been successfully retrieved", {project: projectData});
      });
    });
  }
  else
    return res.success("project has been successfully retrieved", {project: projectData});
};

const update = (req, res) => {
  const { name, description, isPrivate } = req.body;
  const project = req.project;
  if(name)
    project.name = name;
  
  if(description)
    project.description = description;
  else if(typeof description === "string" && !description.length)
    project.description = "";
  
  if(typeof isPrivate === "boolean")
    project.isPrivate = isPrivate;
  
  project.updatedOn = new Date();
  project.save((err, project) => {
    if(err)
      return res.fatalError(err);
    
    const projectData = {
      id: project._id,
      name: project.name,
      description: project.description,
      isPrivate: project.isPrivate,
      createdOn: project.createdOn,
      updatedOn: project.updatedOn
    };

    return res.success("project has been successfully updated", {project: projectData});
  });
};

const remove = (req, res) => {
  const project = req.project;
  project.isActive = false;
  project.deletedOn = new Date();
  project.save((err, project) => {
    if(err)
      return res.fatalError(err);

    const projectData = {
      id: project._id,
      name: project.name,
      isActive: project.isActive,
      createdOn: project.createdOn,
      deletedOn: project.deletedOn
    };

    return res.success("project has been successfully deleted", {project: projectData});
  });
};

export default {
  create,
  getAll,
  getOne,
  update,
  remove
};
