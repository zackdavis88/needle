import Status from "../models/status";

const create = (req, res) => {
  const {name, color, transparent} = req.body;
  const {project} = req;
  Status.create({
    name,
    color,
    transparent,
    project: project._id,
    createdOn: new Date()
  }, (err, status) => {
    if(err)
      return res.fatalError(err);
    
    const statusData = {
      id: status._id,
      project: {
        id: project._id,
        name: project.name
      },
      name: status.name,
      color: status.color,
      transparent: status.transparent,
      createdOn: status.createdOn
    };

    res.success("status has been successfully created", {status: statusData});
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
  Status
    .find(queryArgs)
    .sort({createdOn: "asc"})
    .skip(pageOffset)
    .limit(itemsPerPage)
    .exec((err, statusList) => {
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
        status: statusList.map(status => ({
          id: status._id,
          name: status.name,
          color: status.color,
          transparent: status.transparent,
          createdOn: status.createdOn,
          updatedOn: status.updatedOn
        }))
      };

      return res.success("status list has been successfully retrieved", result);
    });
};

const getOne = (req, res) => {
  const {project, projectStatus} = req;
  const statusData = {
    id: projectStatus._id,
    project: {
      id: project._id,
      name: project.name
    },
    name: projectStatus.name,
    color: projectStatus.color,
    transparent: projectStatus.transparent,
    createdOn: projectStatus.createdOn,
    updatedOn: projectStatus.updatedOn
  };
  return res.success("status has been successfully retrieved", {status: statusData});
};

const update = (req, res) => {
  const {project, projectStatus} = req;
  const {name, color, transparent} = req.body;
  if(name)
    projectStatus.name = name;
  
  if(color)
    projectStatus.color = color;
  else if(typeof color === "string" && !color.length)
    projectStatus.color = null;

  if(typeof transparent === "boolean")
    projectStatus.transparent = transparent;

  projectStatus.updatedOn = new Date();
  projectStatus.save((err, status) => {
    if(err)
      return res.fatalError(err);
    
    const statusData = {
      id: status._id,
      project: {
        id: project._id,
        name: project.name
      },
      name: status.name,
      color: status.color,
      transparent: status.transparent,
      createdOn: status.createdOn,
      updatedOn: status.updatedOn
    };
    return res.success("status has been successfully updated", {status: statusData});
  });
};

const remove = (req, res) => {
  const {projectStatus} = req;
  projectStatus.remove(err => {
    if(err)
      return res.fatalError(err);
    
    return res.success("status has been successfully deleted");
  });
};

const allNames = (req, res) => {
  const {project} = req;
  Status
    .find({project: project._id})
    .sort({createdOn: "asc"})
    .exec((err, allStatus) => {
      if(err)
        return res.fatalError(err);

      const statusNames = allStatus.map(status => {return status.name});
      return res.success("status names have been successfully retrieved", {status: statusNames});
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
