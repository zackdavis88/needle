import controller from "../controllers/auth";
import validator from "../validators/auth";

const authRoutes = (router) => {
  router.route("/auth")
    .get(validator.basicAuthHeader, controller.generateToken);
  
  router.route("/auth/token")
    .get(
      validator.jwtHeader,
      controller.authenticateToken,
      controller.validateToken
    );
};

export default authRoutes;
