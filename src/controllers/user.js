import User from "../models/user";

const create = (req, res) => {
  const { username, password } = req.body;
  User.generateHash(password, (err, hash) => {
    if(err)
      return res.fatalError(err);
    
    User.create({
      username: username.toLowerCase(),
      displayName: username,
      hash: hash,
      apiKey: User.generateKey(),
      isActive: true,
      createdOn: new Date()
    },
    (err, user) => {
      if(err)
        return res.fatalError(err);

      const userData = {
        user: {
          username: user.username,
          displayName: user.displayName,
          createdOn: user.createdOn
        }
      };
      return res.success("user has been successfully created", userData);
    });
  });
};

const getAll = (req, res) => {
  const {
    page,
    totalPages,
    itemsPerPage,
    pageOffset
  } = req.paginationData;
  User
    .find({isActive: true})
    .sort({createdOn: "asc"})
    .skip(pageOffset)
    .limit(itemsPerPage)
    .exec((err, users) => {
      if(err)
        return res.fatalError(err);
      
      const userList = {
        page,
        totalPages,
        itemsPerPage,
        users: users.map((user) => ({
          username: user.username,
          displayName: user.displayName,
          createdOn: user.createdOn
        }))
      };

      return res.success("user list has been successfully retrieved", userList);
    });
};

const getOne = (req, res) => {
  const { requestedUser } = req;
  const userData = {
    user: {
      username: requestedUser.username,
      displayName: requestedUser.displayName,
      createdOn: requestedUser.createdOn
    }
  };
  return res.success("user has been successfully retrieved", userData);
};

const update = (req, res) => {
  const { password } = req.body;
  const user = req.user;
  User.generateHash(password, (err, hash) => {
    if(err)
      return res.fatalError(err);

    user.hash = hash;
    user.updatedOn = new Date();
    return user.save((err, user) => {
      if(err)
        return res.fatalError(err);
      
      const userData = {
        user: {
          username: user.username,
          displayName: user.displayName,
          createdOn: user.createdOn,
          updatedOn: user.updatedOn
        }
      };
  
      res.success("password has been successfully updated", userData);
    });
  });
};

const remove = (req, res) => {
  const {user} = req;
  user.isActive = false;
  user.deletedOn = new Date();
  user.save((err, user) => {
    if(err)
      return res.fatalError(err);
    
    const userData = {
      user: {
        username: user.username,
        displayName: user.displayName,
        isActive: user.isActive,
        createdOn: user.createdOn,
        updatedOn: user.updatedOn,
        deletedOn: user.deletedOn
      }
    };

    return res.success("user has been successfully deleted", userData);
  });
};

export default {
  create,
  getAll,
  getOne,
  update,
  remove
};
