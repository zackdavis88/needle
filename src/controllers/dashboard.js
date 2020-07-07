import Membership from "../models/membership";
import Story from "../models/story";

const get = (req, res) => {
  const {user} = req;
  Membership
    .find({user: user._id})
    .sort({createdOn: "asc"})
    .populate("project", "-description")
    .exec((err, memberships) => {
      if(err)
        return res.fatalError(err);

      Story
        .find({owner: user._id})
        .sort({createdOn: "asc"})
        .populate("project", "-description")
        .populate("creator", "-_id username displayName")
        .exec((err, stories) => {
          if(err)
            return res.fatalError(err);

          const result = {
            projects: memberships.map(({project}) => ({
              id: project._id,
              name: project.name,
              isPrivate: project.isPrivate,
              isActive: project.isActive,
              createdOn: project.createdOn,
              updatedOn: project.updatedOn
            })),
            stories: stories.map(story => ({
              id: story._id,
              name: story.name,
              creator: story.creator,
              project: {
                id: story.project._id,
                name: story.project.name
              },
              createdOn: story.createdOn,
              updatedOn: story.updatedOn
            }))
          };

          return res.success("user dashboard has been successfully retrieved", result);
        });
    });
};

export default {
  get
};