import authController from "../controllers/auth";
import authValidator from "../validators/auth";
import projectValidator from "../validators/project";
import storyValidator from "../validators/story";
import storyController from "../controllers/story";

const projectRoutes = (router) => {
  router.route("/projects/:projectId/stories")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug
    )

    .post(
      authController.authorizeDeveloper,
      storyValidator.create,
      storyController.create
    )
    
    .get(
      authController.authorizeViewer,
      storyValidator.getAll,
      storyController.getAll
    );

  router.route("/projects/:projectId/stories/:storyId")
    .all(
      authValidator.jwtHeader,
      authController.authenticateToken,
      projectValidator.projectIdSlug,
      storyValidator.storyIdSlug
    )

    .get(
      authController.authorizeViewer,
      storyController.getOne
    );
};

export default projectRoutes;
