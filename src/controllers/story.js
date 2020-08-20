import Story from "../models/story";
import {escapeRegex} from "../utils/validator";

const create = (req, res) => {
  const { name, details, points } = req.body;
  const { project, user, owner } = req;
  Story.create({
    name,
    details: details.length ? details : undefined,
    creator: user._id,
    owner: owner ? owner._id : undefined,
    project: project._id,
    points: (!points || parseInt(points) === 0) ? undefined : parseInt(points),
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
      points: story.points,
      createdOn: story.createdOn
    };
    return res.success("story has been successfully created", {story: storyData});
  });  
};

const getAll = (req, res) => {
  const { project, query } = req;
  const {
    page,
    totalPages,
    itemsPerPage
  } = req.paginationData;
  const pageOffset = (page - 1) * itemsPerPage;
  const queryArgs = {project: project._id};
  if(query.filterName)
    queryArgs.name = {$regex: `^${escapeRegex(query.filterName)}`, $options: "i"};
  Story
    .find(queryArgs)
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
          points: story.points,
          createdOn: story.createdOn,
          updatedOn: story.updatedOn
        }))
      };

      return res.success("story list has been successfully retrieved", result);
    });
};

const getOne = (req, res) => {
  const { project, story, requestMembership } = req;
  const storyData = {
    id: story._id,
    name: story.name,
    details: story.details,
    project: {
      id: project._id,
      name: project.name,
      userRoles: requestMembership ? requestMembership.roles : null
    },
    creator: story.creator,
    owner: story.owner || null,
    points: story.points,
    createdOn: story.createdOn,
    updatedOn: story.updatedOn
  };

  return res.success("story has been successfully retrieved", {story: storyData});
};

const update = (req, res) => {
  const { name, details, points } = req.body;
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
  
  if(points)
    story.points = parseInt(points);
  else if(parseInt(points) === 0)
    story.points = null;
  
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
      points: updatedStory.points,
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
