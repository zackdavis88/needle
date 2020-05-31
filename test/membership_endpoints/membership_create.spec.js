import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  generateToken,
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Membership] Create", () => {
  let authTokenAdmin;
  let authTokenManager;
  let authTokenDeveloper;
  let authTokenNonMember;
  let testProject;
  let testUserNonMember;
  let testUserDeveloper;
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
                  testUserNonMember = nonmember;
                  testUserDeveloper = developer;
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  beforeEach((done) => {
    payload = {
      username: testUserNonMember.username,
      roles: {
        isDeveloper: true
      }
    };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });
  describe("POST /projects/:projectId/memberships", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .post("/projects/someProjectId/memberships")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .post(`/projects/[Invalid]/memberships`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .post(`/projects/impossibleId/memberships`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without manager or admin permissions", (done) => {
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(401, {
          error: "you must have manager permissions to perform this action"
        }, done);
    });

    it("should only allow admins to create admin memberships", (done) => {
      payload.roles.isAdmin = true;
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(401, {
          error: "you must have admin permissions to perform this action"
        }, done);
    });

    it("should reject requests that are missing username input", (done) => {
      payload.username = undefined;
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "username is missing from input"
        }, done);
    });

    it("should reject requests when username is not a string", (done) => {
      payload.username = {something: "invalid"};
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "username must be a string"
        }, done);
    });

    it("should reject requests when the requested user does not exist", (done) => {
      payload.username = "doe$NotExist";
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "requested user does not exist"
        }, done);
    });

    it("should reject requests when the membership already exists", (done) => {
      payload.username = testUserDeveloper.username;
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "membership already exists"
        }, done);
    });

    it("should reject requests that are missing roles input", (done) => {
      payload.roles = undefined;
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "roles is missing from input"
        }, done);
    });

    it("should reject requests roles input that is not an object", (done) => {
      payload.roles = "admin, manager";
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "roles must be an object with boolean key-values"
        }, done);
    });

    it("should reject requests roles input that is empty", (done) => {
      payload.roles = {};
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "roles input contains no roles"
        }, done);
    });

    it("should reject requests roles input that contains no valid role", (done) => {
      payload.roles = {somethingInvalid: "admin"};
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "roles must contain at least one valid role"
        }, done);
    });

    it("should successfully create a membership for members with manager permissions", (done) => {
      server
        .post(`/projects/${testProject._id}/memberships`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const { message, membership } = res.body;
          assert.equal(message, "membership has been successfully created");
          assert(membership);
          assert(membership.id);
          assert(membership.user);
          assert.equal(membership.user.username, testUserNonMember.username);
          assert.equal(membership.user.displayName, testUserNonMember.displayName);
          assert.equal(membership.project, testProject._id.toString());
          assert(membership.roles);
          assert.equal(membership.roles.isAdmin, false);
          assert.equal(membership.roles.isManager, false);
          assert.equal(membership.roles.isDeveloper, true);
          assert.equal(membership.roles.isViewer, true);
          assert(membership.createdOn);
          done();
        });
    });
  });
});

