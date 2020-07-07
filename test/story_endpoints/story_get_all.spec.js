import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  createTestStory,
  generateToken,
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Story] Get All", () => {
  let authTokenAdmin;
  let authTokenNonMember;
  let authTokenNoPermission;
  let testProjectPublic;
  let testProjectPrivate;
  let testStory;
  let testUserOwner;
  let testUserCreator;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userNoPermission) => {
        createTestUser("Password1", (userNonMember) => {
          createTestProject(false, userAdmin, (projectPublic) => {
            createTestProject(true, userAdmin, (projectPrivate) => {
              createTestMembership(projectPrivate, userNoPermission, {isViewer: false}, () => {
                createTestStory(projectPrivate, userAdmin, userNoPermission, () => {
                  createTestStory(projectPrivate, userAdmin, userNoPermission, (story) => {
                    createTestStory(projectPrivate, userAdmin, userNoPermission, () => {
                      authTokenAdmin = generateToken(userAdmin);
                      authTokenNonMember = generateToken(userNonMember);
                      authTokenNoPermission = generateToken(userNoPermission);
                      testProjectPublic = projectPublic;
                      testProjectPrivate = projectPrivate;
                      testStory = story;
                      testUserOwner = userNoPermission;
                      testUserCreator = userAdmin;
                      done();
                    });
                  });
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
  
  describe("GET /projects/:projectId/stories", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/projects/someProjectId/stories")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .get(`/projects/[Invalid]/stories`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .get(`/projects/impossibleId/stories`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/stories`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without viewer permissions for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/stories`)
        .set("x-needle-token", authTokenNoPermission)
        .expect(401, {
          error: "you must have viewer permissions to perform this action"
        }, done);
    });

    it("should successfully return a paginated list of stories for project members", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/stories?itemsPerPage=1&page=2`)
        .set("x-needle-token", authTokenAdmin)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const { message, page, totalPages, itemsPerPage, project, stories } = res.body;
          assert.equal(message, "story list has been successfully retrieved");
          assert.equal(page, 2);
          assert.equal(itemsPerPage, 1);
          assert.equal(totalPages, 3);
          assert(project);
          assert.equal(project.id, testProjectPrivate._id.toString());
          assert.equal(project.name, testProjectPrivate.name);
          assert(stories);
          assert.equal(stories.length, 1);
          const story = stories[0];
          assert.equal(story.id, testStory._id.toString());
          assert.equal(story.name, testStory.name);
          assert(story.creator);
          assert.equal(story.creator.username, testUserCreator.username);
          assert.equal(story.creator.displayName, testUserCreator.displayName);
          assert(story.owner);
          assert.equal(story.owner.username, testUserOwner.username);
          assert.equal(story.owner.displayName, testUserOwner.displayName);
          assert(story.createdOn);
          done();
        });
    });

    it("should successfully return a paginated list of stories to any user for public projects", (done) => {
      server
        .get(`/projects/${testProjectPublic._id}/stories`)
        .set("x-needle-token", authTokenNonMember)
        .expect(200, done);
    });
  });
});