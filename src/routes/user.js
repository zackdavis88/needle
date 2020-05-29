import userController from "../controllers/user";
import authController from "../controllers/auth";
import userValidator from "../validators/user";
import authValidator from "../validators/auth";

const userRoutes = (router) => {
  router.route("/users")
    .post(
      userValidator.create, 
      userController.create
    )
    
    .get(
      authValidator.jwtHeader,
      authController.authenticateToken,
      userValidator.getAll,
      userController.getAll
    );

  router.route("/users/:username")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
    )

    .get(
      userValidator.usernameSlug,
      userController.getOne
    )
    
    .post(
      authController.authorizeUserChange,
      userValidator.update,
      userController.update
    )
    
    .delete(
      authController.authorizeUserChange,
      userValidator.remove,
      userController.remove
    );
};

export default userRoutes;
