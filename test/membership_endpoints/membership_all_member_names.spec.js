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

describe("[Membership] All Member Names", () => {
  let authTokenAdmin;
  let authTokenManager;
  let authTokenDeveloper;
  let authTokenNonMember;
  let testProject;
  let testUserAdmin;
  let testUserManager;
  let testUserNonMember;
  let testUserDeveloper;
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
                  testUserAdmin = admin;
                  testUserManager = manager;
                  done();
                });
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
  
  describe("GET /projects/:projectId/memberships/available", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/projects/someProjectId/memberships/all")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .get(`/projects/[Invalid]/memberships/all`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .get(`/projects/impossibleId/memberships/all`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .get(`/projects/${testProject._id}/memberships/all`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without manager or admin permissions", (done) => {
      server
        .get(`/projects/${testProject._id}/memberships/all`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(401, {
          error: "you must have manager permissions to perform this action"
        }, done);
    });

    it("should successfully retrieve a list of member names", (done) => {
      server
        .get(`/projects/${testProject._id}/memberships/all`)
        .set("x-needle-token", authTokenManager)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, users} = res.body;
          assert.equal(message, "member names successfully retrieved");
          assert(users);
          assert.equal(users.indexOf(testUserNonMember.displayName), -1);
          assert.notEqual(users.indexOf(testUserAdmin.displayName), -1);
          assert.notEqual(users.indexOf(testUserManager.displayName), -1);
          assert.notEqual(users.indexOf(testUserDeveloper.displayName), -1);
          done();
        });
    });
  });
});
