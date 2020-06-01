import Story from "../models/story";

const create = (req, res) => {
  const { name, details } = req.body;
  const { project, user, owner } = req;
  Story.create({
    name,
    details: details.length ? details : undefined,
    creator: user._id,
    owner: owner ? owner._id : undefined,
    project: project._id,
    createdOn: new Date()
  }, (err, story) => {
    if(err)
      return res.fatalError(err);
    
    const storyData = {
      id: story._id,
      name: story.name,
      details: story.details,
      creator: {
        username: user.username,
        displayName: user.displayName
      },
      owner: !owner ? undefined : {
        username: owner.username,
        displayName: owner.displayName
      },
      project: {
        id: project._id,
        name: project.name
      },
      createdOn: story.createdOn
    };
    return res.success("story has been successfully created", {story: storyData});
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
  Story
    .find({project: project._id})
    .sort({createdOn: "asc"})
    .populate("creator", "-_id username displayName")
    .populate("owner", "-_id username displayName")
    .skip(pageOffset)
    .limit(itemsPerPage)
    .exec((err, stories) => {
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
        stories: stories.map(story => ({
          id: story._id,
          name: story.name,
          creator: story.creator,
          owner: story.owner,
          createdOn: story.createdOn,
          updatedOn: story.updatedOn
        }))
      };

      return res.success("story list has been successfully retrieved", result);
    });
};

const getOne = (req, res) => {
  const { project, story } = req;
  const storyData = {
    id: story._id,
    name: story.name,
    details: story.details,
    project: {
      id: project._id,
      name: project.name
    },
    creator: story.creator,
    owner: story.owner || null,
    createdOn: story.createdOn,
    updatedOn: story.updatedOn
  };

  return res.success("story has been successfully retrieved", {story: storyData});
};

const update = (req, res) => {
  const { name, details } = req.body;
  const ownerInput = req.body.owner;
  const { project, story, owner } = req;
  if(name)
    story.name = name;
  
  if(details)
    story.details = details;
  else if(typeof details === "string" && !details.length)
    story.details = null;
  
  if(owner)
    story.owner = owner._id;
  else if(typeof ownerInput === "string" && !ownerInput.length)
    story.owner = null;
  
  story.updatedOn = new Date();
  story.save((err, updatedStory) => {
    if(err)
      return res.fatalError(err);

    const storyData = {
      id: updatedStory._id,
      name: updatedStory.name,
      details: updatedStory.details,
      project: {
        id: project._id,
        name: project.name
      },
      creator: story.creator,
      owner: story.owner, // default the owner to whatever we originally pulled from the db.
      createdOn: updatedStory.createdOn,
      updatedOn: updatedStory.updatedOn
    };

    // If the owner field was updated or removed, ensure the storyData variable reflects that.
    if(owner)
      storyData.owner = {username: owner.username, displayName: owner.displayName};
    else if(typeof ownerInput === "string" && !ownerInput.length)
      storyData.owner = null;

    return res.success("story has been successfully updated", {story: storyData});
  });
};

const remove = (req, res) => {
  const { story } = req;
  story.remove(err => {
    if(err)
      return res.fatalError(err);
    
    return res.success("story has been successfully deleted");
  });
};

export default {
  create,
  getAll,
  getOne,
  update,
  remove
};
