import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  generateToken
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Project] Update", () => {
  let authTokenAdmin;
  let authTokenManager;
  let authTokenDeveloper;
  let authTokenNonMember;
  let testProject;
  let payload;
  before(done => {
    createTestUser("Password1", (admin) => {
      createTestUser("Password1", (manager) => {
        createTestUser("Password1", (developer) => {
          createTestUser("Password1", (nonmember) => {
            createTestProject(false, admin, (project) => {
              createTestMembership(project, manager, {isManager: true}, () => {
                createTestMembership(project, developer, {isDeveloper: true}, () => {
                  authTokenAdmin = generateToken(admin);
                  authTokenManager = generateToken(manager);
                  authTokenDeveloper = generateToken(developer);
                  authTokenNonMember = generateToken(nonmember);
                  testProject = project;
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  beforeEach(done => {
    payload = {
      name: "UNIT TEST Project (Updated)",
      description: "This project has been updated via unit testing automation",
      isPrivate: true
    };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });

  describe("POST /projects/:projectId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .post(`/projects/someId`)
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .post(`/projects/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .post(`/projects/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without manager or admin permissions", (done) => {
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(401, {
          error: "you must have manager permissions to perform this action"
        }, done);
    });

    it("should reject requests when the payload contains no data to update", (done) => {
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenManager)
        .expect(400, {
          error: "request contains no update input"
        }, done);
    });

    it("should reject requests when name is not a string", (done) => {
      payload.name = {something: "invalid"};
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "name must be a string"
        }, done);
    });

    it("should reject requests when name is under 3 characters", (done) => {
      payload.name = "z";
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "name must be 3 - 50 characters in length"
        }, done);
    });

    it("should reject requests when name is over 50 characters", (done) => {
      payload.name = "abcdefghijklmnopqrstuvwxyz-_+=&^%$#@!/|{}()0123456789";
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "name must be 3 - 50 characters in length"
        }, done);
    });

    it("should reject requests when name contains invalid characters", (done) => {
      payload.name = "abc-_+=&^%$#@!/|{}()?.,<>;':\"*]";
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "name contains invalid characters"
        }, done);
    });

    it("should reject requests when description is not a string", (done) => {
      payload.description = false;
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "description must be a string"
        }, done);
    });

    it("should reject requests when description is over 350 characters", (done) => {
      payload.description = new Array(351).fill("a").join("");
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "description must be 350 characters or less"
        }, done);
    });

    it("should reject requests when isPrivate input is not a boolean", (done) => {
      payload.isPrivate = "private please";
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "isPrivate must be a boolean"
        }, done);
    });

    it("should successfully allow members with manager permissions to update the requested project", (done) => {
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const { message, project } = res.body;
          assert.equal(message, "project has been successfully updated");
          assert(project);
          assert.equal(project.id.toString(), testProject._id.toString());
          assert.equal(project.name, payload.name);
          assert.equal(project.description, payload.description);
          assert.equal(project.isPrivate, payload.isPrivate);
          assert(project.createdOn);
          assert(project.updatedOn);
          done();
        });
    });

    it("should successfully allow members with admin permissions to update the requested project", (done) => {
      server
        .post(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200, done);
    });
  });
});
