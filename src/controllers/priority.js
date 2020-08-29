import Priority from "../models/priority";

const create = (req, res) => {
  const {name, color, transparent} = req.body;
  const {project} = req;
  Priority.create({
    name,
    color,
    transparent,
    project: project._id,
    createdOn: new Date()
  }, (err, priority) => {
    if(err)
      return res.fatalError(err);
    
    const priorityData = {
      id: priority._id,
      project: {
        id: project._id,
        name: project.name
      },
      name: priority.name,
      color: priority.color,
      transparent: priority.transparent,
      createdOn: priority.createdOn
    };

    res.success("priority has been successfully created", {priority: priorityData});
  });
};

const getAll = (req, res) => {
  const { project } = req;
  const {
    page,
    totalPages,
    itemsPerPage
  } = req.paginationData;
  const pageOffset = (page - 1) * itemsPerPage;
  const queryArgs = {project: project._id};
  Priority
    .find(queryArgs)
    .sort({createdOn: "asc"})
    .skip(pageOffset)
    .limit(itemsPerPage)
    .exec((err, priorities) => {
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
        priorities: priorities.map(priority => ({
          id: priority._id,
          name: priority.name,
          color: priority.color,
          transparent: priority.transparent,
          createdOn: priority.createdOn,
          updatedOn: priority.updatedOn
        }))
      };

      return res.success("priorities list has been successfully retrieved", result);
    });
};

const getOne = (req, res) => {
  const {project, projectPriority} = req;
  const priorityData = {
    id: projectPriority._id,
    project: {
      id: project._id,
      name: project.name
    },
    name: projectPriority.name,
    color: projectPriority.color,
    transparent: projectPriority.transparent,
    createdOn: projectPriority.createdOn,
    updatedOn: projectPriority.updatedOn
  };
  return res.success("priority has been successfully retrieved", {priority: priorityData});
};

const update = (req, res) => {
  const {project, projectPriority} = req;
  const {name, color, transparent} = req.body;
  if(name)
    projectPriority.name = name;
  
  if(color)
    projectPriority.color = color;
  else if(typeof color === "string" && !color.length)
    projectPriority.color = null;

  if(typeof transparent === "boolean")
    projectPriority.transparent = transparent;

  projectPriority.updatedOn = new Date();
  projectPriority.save((err, priority) => {
    if(err)
      return res.fatalError(err);
    
    const priorityData = {
      id: priority._id,
      project: {
        id: project._id,
        name: project.name
      },
      name: priority.name,
      color: priority.color,
      transparent: priority.transparent,
      createdOn: priority.createdOn,
      updatedOn: priority.updatedOn
    };
    return res.success("priority has been successfully updated", {priority: priorityData});
  });
};

const remove = (req, res) => {
  const {projectPriority} = req;
  projectPriority.remove(err => {
    if(err)
      return res.fatalError(err);
    
    return res.success("priority has been successfully deleted");
  });
};

const allNames = (req, res) => {
  const {project} = req;
  Priority
    .find({project: project._id})
    .sort({createdOn: "asc"})
    .distinct("name")
    .exec((err, priorityNames) => {
      if(err)
        return res.fatalError(err);
      
      return res.success("priority names have been successfully retrieved", {priorities: priorityNames});
    });
};

export default {
  create,
  getAll,
  getOne,
  update,
  remove,
  allNames
};
