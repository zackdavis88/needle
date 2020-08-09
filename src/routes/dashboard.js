import dashboardController from "../controllers/dashboard";
import dashboardValidator from "../validators/dashboard";
import authController from "../controllers/auth";
import authValidator from "../validators/auth";

const dashboardRoutes = (router) => {
  router.route("/dashboard")
    .all(authValidator.jwtHeader, authController.authenticateToken)
    .get(dashboardController.get);

  router.route("/dashboard/projects")
    .all(authValidator.jwtHeader, authController.authenticateToken)
    .get(
      dashboardValidator.getProjects,
      dashboardController.getProjects
    );

  router.route("/dashboard/stories")
    .all(authValidator.jwtHeader, authController.authenticateToken)
    .get(
      dashboardValidator.getStories,
      dashboardController.getStories
    );    
};

export default dashboardRoutes;
