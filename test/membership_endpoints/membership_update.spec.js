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

describe("[Membership] Update", () => {
  let authTokenAdmin;
  let authTokenManager;
  let authTokenDeveloper;
  let authTokenNonMember;
  let testUserDeveloper;
  let testProject;
  let testMembership;
  let payload;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userManager) => {
        createTestUser("Password1", (userDeveloper) => {
          createTestUser("Password1", (userNonMember) => {
            createTestProject(false, userAdmin, (project) => {
              createTestMembership(project, userManager, {isManager: true}, () => {
                createTestMembership(project, userDeveloper, {isDeveloper: true}, (membership) => {
                  authTokenAdmin = generateToken(userAdmin);
                  authTokenManager = generateToken(userManager);
                  authTokenDeveloper = generateToken(userDeveloper);
                  authTokenNonMember = generateToken(userNonMember);
                  testUserDeveloper = userDeveloper;
                  testProject = project;
                  testMembership = membership;
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
      roles: {
        isDeveloper: false,
        isViewer: false
      }
    };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });

  describe("POST /projects/:projectId/memberships/:membershipId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .post("/projects/someProjectId/memberships/someMembershipId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .post(`/projects/[Invalid]/memberships/someMembershipId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .post(`/projects/impossibleId/memberships/someMembershipId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the membershipId slug is invalid", (done) => {
      server
        .post(`/projects/${testProject._id}/memberships/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "membership id is not valid"
        }, done);
    });

    it("should reject requests when the requested membership is not found", (done) => {
      server
        .post(`/projects/${testProject._id}/memberships/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested membership not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .post(`/projects/${testProject._id}/memberships/${testMembership._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without manager or admin permissions", (done) => {
      server
        .post(`/projects/${testProject._id}/memberships/${testMembership._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(401, {
          error: "you must have manager permissions to perform this action"
        }, done);
    });

    it("should only allow admins to add admin permissions", (done) => {
      payload.roles.isAdmin = true;
      server
        .post(`/projects/${testProject._id}/memberships/${testMembership._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(401, {
          error: "you must have admin permissions to perform this action"
        }, done);
    });

    it("should only allow admins to remove admin permissions", (done) => {
      payload.roles.isAdmin = false;
      server
        .post(`/projects/${testProject._id}/memberships/${testMembership._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(401, {
          error: "you must have admin permissions to perform this action"
        }, done);
    });

    it("should reject requests that are missing roles input", (done) => {
      payload.roles = undefined;
      server
        .post(`/projects/${testProject._id}/memberships/${testMembership._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "roles is missing from input"
        }, done);
    });

    it("should reject requests roles input that is not an object", (done) => {
      payload.roles = "admin, manager";
      server
        .post(`/projects/${testProject._id}/memberships/${testMembership._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "roles must be an object with boolean key-values"
        }, done);
    });

    it("should reject requests roles input that is empty", (done) => {
      payload.roles = {};
      server
        .post(`/projects/${testProject._id}/memberships/${testMembership._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "roles input contains no roles"
        }, done);
    });

    it("should reject requests roles input that contains no valid role", (done) => {
      payload.roles = {somethingInvalid: "admin"};
      server
        .post(`/projects/${testProject._id}/memberships/${testMembership._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "roles must contain at least one valid role"
        }, done);
    });

    it("should successfully allow users with manager permissions to update the requested membership", (done) => {
      server
        .post(`/projects/${testProject._id}/memberships/${testMembership._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const { message, membership } = res.body;
          assert.equal(message, "membership has been successfully updated");
          assert(membership);
          const { id, project, user, roles, createdOn, updatedOn } = membership;
          assert.equal(id, testMembership._id.toString());
          assert(project);
          assert.equal(project.id, testProject._id.toString());
          assert.equal(project.name, testProject.name);
          assert(user);
          assert.equal(user.username, testUserDeveloper.username);
          assert.equal(user.displayName, testUserDeveloper.displayName);
          assert(roles);
          assert.equal(roles.isAdmin, false);
          assert.equal(roles.isManager, false);
          assert.equal(roles.isDeveloper, false);
          assert.equal(roles.isViewer, false);
          assert(createdOn);
          assert(updatedOn);
          done();
        });
    });

    it("should successfully allow users with admin permissions to update the requested membership", (done) => {
      payload.roles = {isAdmin: true};
      server
        .post(`/projects/${testProject._id}/memberships/${testMembership._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200, done);
    });
  });
});
