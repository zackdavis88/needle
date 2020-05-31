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

describe("[Membership] Get All", () => {
  let testUserAdmin;
  let authTokenAdmin;
  let authTokenNoPermissions;
  let authTokenNonMember;
  let testProjectPublic;
  let testProjectPrivate;
  before(done => {
    createTestUser("Password1", (admin) => {
      createTestUser("Password1", (noPermissions) => {
        createTestUser("Password1", (nonMember) => {
          createTestProject(false, admin, (publicProject) => {
            createTestProject(true, admin, (privateProject) => {
              createTestMembership(privateProject, noPermissions, {isViewer: false}, () => {
                testUserAdmin = admin;
                authTokenAdmin = generateToken(admin);
                authTokenNoPermissions = generateToken(noPermissions);
                authTokenNonMember = generateToken(nonMember);
                testProjectPublic = publicProject;
                testProjectPrivate = privateProject;
                done();
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

  describe("GET /projects/:projectId/memberships", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/projects/someProjectId/memberships")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .get(`/projects/[Invalid]/memberships`)
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

    it("should reject requests from non-members for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/memberships`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without viewer permissions for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/memberships`)
        .set("x-needle-token", authTokenNoPermissions)
        .expect(401, {
          error: "you must have viewer permissions to perform this action"
        }, done);
    });

    it("should successfully return a paginated list of memberships", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/memberships`)
        .set("x-needle-token", authTokenAdmin)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);

          const { message, page, itemsPerPage, totalPages, project, memberships } = res.body;
          assert.equal(message, "membership list has been successfully retrieved");
          assert.equal(page, 1);
          assert.equal(itemsPerPage, 10);
          assert.equal(totalPages, 1);
          assert(project);
          assert.equal(project.id, testProjectPrivate._id);
          assert.equal(project.name, testProjectPrivate.name);
          assert(memberships);
          assert.equal(memberships.length, 2);
          // Default sort is createdBy ascending, so the first membership should be the admin user in this test file.
          const membership = memberships[0];
          assert(membership);
          assert(membership.id);
          assert(membership.user);
          assert.equal(membership.user.username, testUserAdmin.username);
          assert.equal(membership.user.displayName, testUserAdmin.displayName);
          assert(membership.roles);
          assert.equal(membership.roles.isAdmin, true);
          assert(membership.createdOn);
          done();
        });
    });

    it("should successfully return a paginated list of memberships to any user for public projects", (done) => {
      server
        .get(`/projects/${testProjectPublic._id}/memberships`)
        .set("x-needle-token", authTokenNonMember)
        .expect(200, done);
    });
  });
});
