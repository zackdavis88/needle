import dashboardController from "../controllers/dashboard";
import authController from "../controllers/auth";
import authValidator from "../validators/auth";

const userRoutes = (router) => {
  router.route("/dashboard")
    .all(authValidator.jwtHeader, authController.authenticateToken)
    .get(dashboardController.get);
};

export default userRoutes;
