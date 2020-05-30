import authController from "../controllers/auth";
import projectController from "../controllers/project";
import authValidator from "../validators/auth";
import projectValidator from "../validators/project";

const projectRoutes = (router) => {
  router.route("/projects")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
    )

    .post(
      projectValidator.create, 
      projectController.create
    )

    .get(
      projectValidator.getAll,
      projectController.getAll
    );

  router.route("/projects/:projectId")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug
    )
    
    .get(
      authController.authorizeViewer,
      projectController.getOne
    )
    
    .post(
      authController.authorizeManager,
      projectValidator.update,
      projectController.update
    )
    
    .delete(
      authController.authorizeAdmin,
      projectValidator.remove,
      projectController.remove
    );
};

export default projectRoutes;
