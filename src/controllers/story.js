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

export default {
  create
};
