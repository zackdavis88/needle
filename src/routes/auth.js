import controller from "../controllers/auth";
import validator from "../validators/auth";

const authRoutes = (router) => {
  router.route("/auth")
    .get(validator.basicAuthHeader, controller.generateToken);
  
  router.route("/auth/token")
    .get(validator.jwtHeader, controller.authenticateToken, (req, res) => {
      const {user} = req;
      const userData = {
        user: {
          username: user.username,
          displayName: user.displayName,
          createdOn: user.createdOn,
          updatedOn: user.updatedOn
        }
      }
      res.success("user successfully authenticated via token", userData);
    });
};

export default authRoutes;
