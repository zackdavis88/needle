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

describe("[Membership] Get One", () => {
  let testUserNoPermissions;
  let testProjectPublic;
  let testProjectPrivate;
  let testMembershipPrivate;
  let testMembershipPublic;
  let authTokenAdmin;
  let authTokenNoPermissions;
  let authTokenNonMember;
  before(done => {
    createTestUser("Password1", (admin) => {
      createTestUser("Password1", (user) => {
        createTestUser("Password1", (nonMember) => {
          createTestProject(false, admin, (publicProject) => {
            createTestProject(true, admin, (privateProject) => {
              createTestMembership(privateProject, user, {isViewer: false}, (membershipPrivate) => {
                createTestMembership(publicProject, user, {isDeveloper: true}, (membershipPublic) => {
                  testUserNoPermissions = user;
                  authTokenAdmin = generateToken(admin);
                  authTokenNoPermissions = generateToken(user);
                  authTokenNonMember = generateToken(nonMember);
                  testProjectPublic = publicProject;
                  testProjectPrivate = privateProject;
                  testMembershipPrivate = membershipPrivate;
                  testMembershipPublic = membershipPublic;
                  done();
                });
              });
            });
          });
        });
      });
    })
  });

  after(done => {
    cleanupTestRecords(done);
  });

  describe("GET /projects/:projectId/memberships/:membershipId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/projects/someProjectId/memberships/someMembershipId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .get(`/projects/[Invalid]/memberships/someMembershiup`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .get(`/projects/impossibleId/memberships`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the membershipId slug is invalid", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/memberships/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "membership id is not valid"
        }, done);
    });

    it("should reject requests when the requested membership is not found", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/memberships/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested membership not found"
        }, done);
    });

    it("should reject requests from non-members for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/memberships/${testMembershipPrivate._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without viewer permissions for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/memberships/${testMembershipPrivate._id}`)
        .set("x-needle-token", authTokenNoPermissions)
        .expect(401, {
          error: "you must have viewer permissions to perform this action"
        }, done);
    });

    it("should successfully return membership details", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/memberships/${testMembershipPrivate._id}`)
        .set("x-needle-token", authTokenAdmin)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const { message, membership } = res.body;
          assert.equal(message, "membership has been successfully retrieved");
          assert(membership);
          assert.equal(membership.id, testMembershipPrivate._id.toString());
          assert(membership.project);
          assert.equal(membership.project.id, testProjectPrivate._id.toString());
          assert.equal(membership.project.name, testProjectPrivate.name);
          assert(membership.user);
          assert(membership.user.username, testUserNoPermissions.username);
          assert(membership.user.displayName, testUserNoPermissions.displayName);
          assert(membership.roles);
          assert.equal(membership.roles.isAdmin, false);
          assert.equal(membership.roles.isManager, false);
          assert.equal(membership.roles.isDeveloper, false);
          assert.equal(membership.roles.isViewer, false);
          assert(membership.createdOn);
          done();
        });
    });

    it("should successfully return membership details to any user for public projects", (done) => {
      server
        .get(`/projects/${testProjectPublic._id}/memberships/${testMembershipPublic._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(200, done);
    });
  });
});
