import authController from "../controllers/auth";
import authValidator from "../validators/auth";
import projectValidator from "../validators/project";
import membershipValidator from "../validators/membership";
import membershipController from "../controllers/membership";

const projectRoutes = (router) => {
  router.route("/projects/:projectId/memberships")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug
    )

    .post(
      authController.authorizeManager,
      membershipValidator.create,
      membershipController.create
    );
};

export default projectRoutes;
