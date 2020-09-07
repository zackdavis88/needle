import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  createTestStory,
  generateToken
} from "../utils";
import { request } from "express";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Project] Get One", () => {
  let testUserAdmin;
  let testUserNonMember;
  let testUserNoPermissions;
  let authTokenAdmin;
  let authTokenNonMember;
  let authTokenNoPermissions;
  let testProjectPrivate;
  let testProjectPublic;
  before((done) => {
    createTestUser("Password1", (user) => {
      testUserAdmin = user;
      authTokenAdmin = generateToken(testUserAdmin);
      createTestUser("Password1", (user) => {
        testUserNonMember = user;
        authTokenNonMember = generateToken(testUserNonMember);
        createTestUser("Password1", (user) => {
          testUserNoPermissions = user;
          authTokenNoPermissions = generateToken(testUserNoPermissions);
          createTestProject(true, testUserAdmin, (project) => {
            testProjectPrivate = project;
            createTestProject(false, testUserAdmin, (project) => {
              testProjectPublic = project;
              createTestMembership(testProjectPrivate, testUserNoPermissions, {isViewer: false}, () => {
                createTestStory(testProjectPrivate, testUserAdmin, false, null, null, () => {
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("GET /projects/:projectId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get(`/projects/${testProjectPublic._id}`)
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .get(`/projects/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .get(`/projects/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members when the project is private", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without viewer permissions when the project is private", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}`)
        .set("x-needle-token", authTokenNoPermissions)
        .expect(401, {
          error: "you must have viewer permissions to perform this action"
        }, done);
    });

    it("it should successfully return project details", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}`)
        .set("x-needle-token", authTokenAdmin)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);

          const { message, project, userRoles } = res.body;
          // Validate that userRoles are being returned, we expect this test to return userRoles at admin level.
          assert(userRoles);
          assert(userRoles.isAdmin);
          assert(!userRoles.isManager);
          assert(!userRoles.isDeveloper);
          assert(userRoles.isViewer);

          // Validate expected Project data is returned.
          const {
            id,
            name,
            description,
            isPrivate,
            createdOn,
            statistics
          } = project;
          assert.equal(message, "project has been successfully retrieved");
          assert.equal(id, testProjectPrivate._id);
          assert.equal(name, testProjectPrivate.name);
          assert.equal(description, testProjectPrivate.description);
          assert.equal(isPrivate, testProjectPrivate.isPrivate);
          assert(createdOn);
          assert.equal(statistics, undefined);
          done();
        });
    });

    it("should successfully return project details to any user when the project is public", (done) => {
      server
        .get(`/projects/${testProjectPublic._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {userRoles} = res.body;
          assert.equal(userRoles, null);
          done();
        });
    });

    it("should include project statistics if includeStatistics query-string is set to 'true'", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}?includeStatistics=true`)
        .set("x-needle-token", authTokenAdmin)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {statistics} = res.body.project;
          assert(statistics);
          assert.equal(statistics.memberships, 2);
          assert.equal(statistics.stories, 1);
          done();
        });
    });
  });
});

