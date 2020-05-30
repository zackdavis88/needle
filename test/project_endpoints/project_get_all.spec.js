import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  generateToken
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Project] Get All", () => {
  let testUser;
  let authToken;
  before((done) => {
    createTestUser("Password1", (user) => {
      testUser = user;
      authToken = generateToken(testUser);
      createTestProject(false, testUser, () => {
        createTestProject(true, testUser, () => {
          createTestProject(false, testUser, () => {
            done();
          });
        });
      });
    });
  });

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("GET /projects", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get(`/projects?itemsPerPage=2&page=1`)
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should successfully return a paginated list of projects", (done) => {
      server
        .get(`/projects?itemsPerPage=2&page=1`)
        .set("x-needle-token", authToken)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);

          const { message, page, itemsPerPage, totalPages, projects } = res.body;
          assert.equal(message, "project list has been successfully retrieved");
          assert.equal(page, 1);
          assert.equal(itemsPerPage, 2);
          assert(totalPages);
          assert(projects.length);
          const project = projects[0];
          assert(project.id);
          assert(project.name);
          assert.equal(typeof project.isPrivate, "boolean");
          assert(project.createdOn);
          done();
        });
    });
  });
});
