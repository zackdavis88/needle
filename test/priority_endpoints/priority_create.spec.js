import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  createTestPriority,
  generateToken,
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Priority] Create", () => {
  let authTokenDeveloper;
  let authTokenAdmin;
  let authTokenNonMember;
  let testProject;
  let testPriority;
  let payload;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userDeveloper) => {
        createTestUser("Password1", (userNonMember) => {
          createTestProject(true, userAdmin, (project) => {
            createTestMembership(project, userDeveloper, {isDeveloper: true}, () => {
              createTestPriority(project, (priority) => {
                testPriority = priority;
                testProject = project;
                authTokenAdmin = generateToken(userAdmin);
                authTokenDeveloper = generateToken(userDeveloper);
                authTokenNonMember = generateToken(userNonMember);
                done();
              });
            });
          });
        });
      });
    });
  });

  beforeEach((done) => {
    payload = {
      name: "UNIT TEST Priority",
    };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });
  
  describe("POST /projects/:projectId/priorities", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .post("/projects/someProjectId/priorities")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .post(`/projects/[Invalid]/priorities`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .post(`/projects/impossibleId/priorities`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without manager permissions", (done) => {
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(401, {
          error: "you must have manager permissions to perform this action"
        }, done);
    });

    it("should reject requests when name input is missing", (done) => {
      payload.name = undefined;
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name is missing from input"
        }, done);
    });

    it("should reject requests when name input is not a string", (done) => {
      payload.name = {something: "wrong"};
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name must be a string"
        }, done);
    });

    it("should reject requests when name is less than 1 character", (done) => {
      payload.name = "";
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name must be 1 - 26 characters in length"
        }, done);
    });

    it("should reject requests when name is over than 26 characters", (done) => {
      payload.name = "this is a very long name that will be invalid";
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name must be 1 - 26 characters in length"
        }, done);
    });

    it("should reject requests when name contains invalid characters", (done) => {
      payload.name = "abc&^%!/|{}()?.,<>;':\"*]";
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name contains invalid characters"
        }, done);
    });

    it("should reject requests when name is already taken", (done) => {
      payload.name = testPriority.name;
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name is already taken"
        }, done);
    });

    it("should reject requests when color is not a string", (done) => {
      payload.color = {some: "color"};
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "color must be a string"
        }, done);
    });

    it("should reject requests when color is not a valid format", (done) => {
      payload.color = "black";
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "color has invalid format. example #000000"
        }, done);
    });

    it("should reject requests when transparent is not a boolean", (done) => {
      payload.transparent = "#00000000";
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "transparent must be a boolean"
        }, done);
    });

    it("should successfully create a priority", (done) => {
      server
        .post(`/projects/${testProject._id}/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, priority} = res.body;
          assert.equal(message, "priority has been successfully created");
          assert(priority);
          const {id, project, name, createdOn} = priority;
          assert(id);
          assert.equal(project.id, testProject._id);
          assert.equal(project.name, testProject.name);
          assert.equal(name, payload.name);
          assert(createdOn);
          done();
        });
    });
  });
});
