import fs from "fs";
import { setResponseHandlers } from "../utils/response";

export const configureRoutesAndHandlers = (router, callback) => {
  // Setup Response Handlers.
  router.route("*")
    .all((req, res, next) => {
      setResponseHandlers(res);
      next();
    });

  // Read other route files and configure router with their data.
  fs.readdir("./src/routes", (err, items) => {
    err ? (
      callback(err)
    ) : (
      items.forEach((item, index, array) => {
        const fileName = item.split(".")[0];
        if(fileName.toLowerCase() !== "index"){
          const routeConfigFunction = require(`./${fileName}`).default;
          routeConfigFunction(router);
        }
      })
    );

    callback();
  });
};
