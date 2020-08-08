import authController from "../controllers/auth";
import authValidator from "../validators/auth";
import projectValidator from "../validators/project";
import membershipValidator from "../validators/membership";
import membershipController from "../controllers/membership";

const membershipRoutes = (router) => {
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
    )
    
    .get(
      authController.authorizeViewer,
      membershipValidator.getAll,
      membershipController.getAll
    );

  router.route("/projects/:projectId/memberships/available")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug,
      authController.authorizeManager
    )

    .get(membershipController.availableUsers);

  router.route("/projects/:projectId/memberships/all")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug,
      authController.authorizeManager
    )

    .get(membershipController.allMemberNames);

  router.route("/projects/:projectId/memberships/:membershipId")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug,
      membershipValidator.membershipIdSlug
    )

    .get(
      authController.authorizeViewer,
      membershipController.getOne
    )
    
    .post(
      authController.authorizeManager,
      membershipValidator.update,
      membershipController.update
    )
    
    .delete(
      authController.authorizeManager,
      membershipValidator.remove,
      membershipController.remove
    );
};

export default membershipRoutes;
