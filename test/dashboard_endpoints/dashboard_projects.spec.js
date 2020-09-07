import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  generateToken,
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Dashboard] Get Projects", () => {
  let authToken;
  let project;
  before(done => {
    createTestUser("Password1", (user) => {
      createTestProject(false, user, (project1) => {
        createTestProject(true, user, (project2) => {
          createTestProject(false, user, (project3) => {
            createTestProject(false, user, (project4) => {
              project = project1;
              project4.isActive = false;
              project4.save(() => {
                authToken = generateToken(user);
                done();
              });
            });
          });
        });
      });
    });
  });

  after(done => {
    cleanupTestRecords(done);
  });

  describe("GET /dashboard/projects", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/dashboard/projects")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should successfully return dashboard projects details", (done) => {
      server
        .get("/dashboard/projects")
        .set("x-needle-token", authToken)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, projects} = res.body;
          assert.equal(message, "dashboard projects successfully retrieved");
          assert(projects);
          assert.equal(projects.length, 3);
          done();
        });
    });

    it("should successfully return dashboard projects details based on filterName query-string", (done) => {
      server
        .get(`/dashboard/projects?filterName=${project.name}`)
        .set("x-needle-token", authToken)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, projects} = res.body;
          assert.equal(message, "dashboard projects successfully retrieved");
          assert(projects);
          assert.equal(projects.length, 1);
          assert.equal(projects[0].name, project.name);
          done();
        });
    });
  });
});
