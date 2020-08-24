import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  createTestStory,
  createTestPriority,
  generateToken,
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Story] Get One", () => {
  let authTokenAdmin;
  let authTokenNonMember;
  let authTokenNoPermission;
  let testProjectPublic;
  let testProjectPrivate;
  let testStory;
  let testStoryPublic;
  let testUserCreator;
  let testPriority;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userNoPermission) => {
        createTestUser("Password1", (userNonMember) => {
          createTestProject(false, userAdmin, (projectPublic) => {
            createTestProject(true, userAdmin, (projectPrivate) => {
              createTestMembership(projectPrivate, userNoPermission, {isViewer: false}, () => {
                createTestPriority(projectPrivate, (priority) => {
                  createTestStory(projectPrivate, userAdmin, null, priority, (story) => {
                    createTestStory(projectPublic, userAdmin, null, null, (storyPublic) => {
                      authTokenAdmin = generateToken(userAdmin);
                      authTokenNonMember = generateToken(userNonMember);
                      authTokenNoPermission = generateToken(userNoPermission);
                      testProjectPublic = projectPublic;
                      testProjectPrivate = projectPrivate;
                      testStory = story;
                      testStoryPublic = storyPublic;
                      testUserCreator = userAdmin;
                      testPriority = priority;
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
  
  describe("GET /projects/:projectId/stories/:storyId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/projects/someProjectId/stories/someStoryId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .get(`/projects/[Invalid]/stories/someStoryId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .get(`/projects/impossibleId/stories/someStoryId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the storyId slug is invalid", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/stories/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "story id is not valid"
        }, done);
    });

    it("should reject requests when the requested story is not found", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/stories/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested story not found"
        }, done);
    });

    it("should reject requests from non-members for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without viewer permissions for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenNoPermission)
        .expect(401, {
          error: "you must have viewer permissions to perform this action"
        }, done);
    });

    it("should successfully return story details for project members", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenAdmin)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);

          const { message, story } = res.body;
          assert.equal(message, "story has been successfully retrieved");
          assert(story);
          const { id, name, details, creator, owner, project, createdOn } = story;
          assert.equal(id, testStory._id.toString());
          assert.equal(name, testStory.name);
          assert.equal(details, testStory.details);
          assert(creator);
          assert.equal(creator.username, testUserCreator.username);
          assert.equal(creator.displayName, testUserCreator.displayName);
          assert(!owner);
          assert(project);
          assert.equal(project.id, testProjectPrivate._id);
          assert.equal(project.name, testProjectPrivate.name);
          assert(story.points, testStory.points);
          assert(story.priority);
          assert.equal(story.priority.name, testPriority.name);
          assert.equal(story.priority.color, testPriority.color);
          assert(createdOn);
          done();
        });
    });

    it("should successfully return story details to any user for public projects", (done) => {
      server
        .get(`/projects/${testProjectPublic._id}/stories/${testStoryPublic._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(200, done);
    });
  });
});
