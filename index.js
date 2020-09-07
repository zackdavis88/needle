import fs from "fs";
import https from "https";
import morgan from "morgan";
import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import { port } from "./config/app";
const node_env = process.env.NODE_ENV;
const dbConfigPath = node_env === "production" ? "./config/db-prod" : "./config/db";
const dbConfig = require(dbConfigPath)
const {dbHost, dbPort, dbName, options} = dbConfig;
import { configureRoutesAndHandlers } from "./src/routes/index";
const databaseUrl = `mongodb://${dbHost}:${dbPort}/${dbName}`;
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useNewUrlParser", true);
mongoose.connect(databaseUrl, options);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  const app = express();
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(morgan("dev"));
  app.use(methodOverride());
  
  const apiRouter = express.Router();
  configureRoutesAndHandlers(apiRouter, (err) => {
    if(err)
      return console.error("failed to configure routes, startup terminated.");

    app.use(apiRouter);
    app.use("*", (req, res) => {
      return res.notFoundError("API route not found");
    });
    const httpsServer = https.createServer({
      key: fs.readFileSync("./config/ssl/key.pem"),
      cert: fs.readFileSync("./config/ssl/cert.pem")
    }, app);
    httpsServer.listen(port);

    console.log(`Needle API Environment: ${node_env && node_env.toUpperCase() || "Dev"}`)
    console.log(`Needle API is listening on port ${port}.`);
  });
});
