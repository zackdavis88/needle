import authController from "../controllers/auth";
import authValidator from "../validators/auth";
import projectValidator from "../validators/project";
import priorityValidator from "../validators/priority";
import priorityController from "../controllers/priority";

const priorityRoutes = (router) => {
  router.route("/projects/:projectId/priorities")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug
    )
    
    .post(
      authController.authorizeManager,
      priorityValidator.create,
      priorityController.create
    )
    
    .get(
      authController.authorizeViewer,
      priorityValidator.getAll,
      priorityController.getAll
    );
  
  router.route("/projects/:projectId/priorities/all")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug,
      authController.authorizeDeveloper
    )
    
    .get(priorityController.allNames);
  
  router.route("/projects/:projectId/priorities/:priorityId")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug,
      priorityValidator.priorityIdSlug
    )
    
    .get(
      authController.authorizeViewer,
      priorityController.getOne
    )
    
    .post(
      authController.authorizeManager,
      priorityValidator.update,
      priorityController.update
    )
    
    .delete(
      authController.authorizeManager,
      priorityValidator.remove,
      priorityController.remove
    );
};

export default priorityRoutes;
