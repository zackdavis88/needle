import supertest from "supertest";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  generateToken,
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Membership] Remove", () => {
  let authTokenAdmin;
  let authTokenManager;
  let authTokenDeveloper;
  let authTokenNonMember;
  let testProject;
  let testMembershipDeveloper;
  let testMembershipAdmin;
  let payload;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userManager) => {
        createTestUser("Password1", (userDeveloper) => {
          createTestUser("Password1", (userNonMember) => {
            createTestProject(false, userAdmin, (project, adminMembership) => {
              createTestMembership(project, userManager, {isManager: true}, () => {
                createTestMembership(project, userDeveloper, {isDeveloper: true}, (membership) => {
                  authTokenAdmin = generateToken(userAdmin);
                  authTokenManager = generateToken(userManager);
                  authTokenDeveloper = generateToken(userDeveloper);
                  authTokenNonMember = generateToken(userNonMember);
                  testProject = project;
                  testMembershipDeveloper = membership;
                  testMembershipAdmin = adminMembership;
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
    payload = { confirm: true };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });

  describe("DELETE /projects/:projectId/memberships/:membershipId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .delete("/projects/someProjectId/memberships/someMembershipId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .delete(`/projects/[Invalid]/memberships/someMembershipId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .delete(`/projects/impossibleId/memberships/someMembershipId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the membershipId slug is invalid", (done) => {
      server
        .delete(`/projects/${testProject._id}/memberships/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "membership id is not valid"
        }, done);
    });

    it("should reject requests when the requested membership is not found", (done) => {
      server
        .delete(`/projects/${testProject._id}/memberships/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested membership not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .delete(`/projects/${testProject._id}/memberships/${testMembershipDeveloper._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without manager or admin permissions", (done) => {
      server
        .delete(`/projects/${testProject._id}/memberships/${testMembershipDeveloper._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(401, {
          error: "you must have manager permissions to perform this action"
        }, done);
    });

    it("should only allow admins to remove other admins", (done) => {
      server
        .delete(`/projects/${testProject._id}/memberships/${testMembershipAdmin._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(401, {
          error: "you must have admin permissions to perform this action"
        }, done);
    });

    it("should reject requests that are missing confirm input", (done) => {
      payload.confirm = undefined;
      server
        .delete(`/projects/${testProject._id}/memberships/${testMembershipDeveloper._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "confirm is missing from input"
        }, done);
    });

    it("should reject requests when confirm is not a boolean", (done) => {
      payload.confirm = "do it";
      server
        .delete(`/projects/${testProject._id}/memberships/${testMembershipDeveloper._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "confirm must be a boolean"
        }, done);
    });

    it("should reject requests when confirm is not true", (done) => {
      payload.confirm = false;
      server
        .delete(`/projects/${testProject._id}/memberships/${testMembershipDeveloper._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(400, {
          error: "confirm must be set to true to remove this record"
        }, done);
    });

    it("should successfully remove the requested membership", (done) => {
      server
        .delete(`/projects/${testProject._id}/memberships/${testMembershipDeveloper._id}`)
        .set("x-needle-token", authTokenManager)
        .send(payload)
        .expect(200, {
          message: "membership has been successfully deleted"
        }, done);
    });

    it("should successfully remove admin memberships for admin members", (done) => {
      server
        .delete(`/projects/${testProject._id}/memberships/${testMembershipAdmin._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200, {
          message: "membership has been successfully deleted"
        }, done);
    });
  });
});
