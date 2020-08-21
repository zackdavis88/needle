import authController from "../controllers/auth";
import authValidator from "../validators/auth";
import projectValidator from "../validators/project";
import statusValidator from "../validators/status";
import statusController from "../controllers/status";

const statusRoutes = (router) => {
  router.route("/projects/:projectId/status")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug
    )
    
    .post(
      authController.authorizeManager,
      statusValidator.create,
      statusController.create
    )
    
    .get(
      authController.authorizeViewer,
      statusValidator.getAll,
      statusController.getAll
    );
  
  router.route("/projects/:projectId/status/all")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug,
      authController.authorizeDeveloper
    )
    
    .get(statusController.allNames);
  
  router.route("/projects/:projectId/status/:statusId")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug,
      statusValidator.statusIdSlug
    )
    
    .get(
      authController.authorizeViewer,
      statusController.getOne
    )
    
    .post(
      authController.authorizeManager,
      statusValidator.update,
      statusController.update
    )
    
    .delete(
      authController.authorizeManager,
      statusValidator.remove,
      statusController.remove
    );
};

export default statusRoutes;
