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

describe("[Story] Remove", () => {
  let authTokenDeveloper;
  let authTokenViewer;
  let authTokenNonMember;
  let testProject;
  let testStory;
  let payload;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userDeveloper) => {
        createTestUser("Password1", (userViewer) => {
          createTestUser("Password1", (userNonMember) => {
            createTestProject(false, userAdmin, (project) => {
              createTestMembership(project, userDeveloper, {isDeveloper: true}, () => {
                createTestMembership(project, userViewer, {isViewer: true}, () => {
                  createTestStory(project, userDeveloper, null, null, null, (story) => {
                    authTokenDeveloper = generateToken(userDeveloper);
                    authTokenViewer = generateToken(userViewer);
                    authTokenNonMember = generateToken(userNonMember);
                    testProject = project;
                    testStory = story;
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

  beforeEach((done) => {
    payload = {confirm: true};
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });
  
  describe("DELETE /projects/:projectId/stories/:storyId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .delete("/projects/someProjectId/stories/someStoryId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .delete(`/projects/[Invalid]/stories/someStoryId`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .delete(`/projects/impossibleId/stories/someStoryId`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the storyId slug is invalid", (done) => {
      server
        .delete(`/projects/${testProject._id}/stories/[Invalid]`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(400, {
          error: "story id is not valid"
        }, done);
    });

    it("should reject requests when the requested story is not found", (done) => {
      server
        .delete(`/projects/${testProject._id}/stories/impossibleId`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(404, {
          error: "requested story not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .delete(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without developer permissions", (done) => {
      server
        .delete(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenViewer)
        .expect(401, {
          error: "you must have developer permissions to perform this action"
        }, done);
    });

    it("should reject requests that are missing confirm input", (done) => {
      payload.confirm = undefined;
      server
        .delete(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "confirm is missing from input"
        }, done);
    });

    it("should reject requests when confirm is not a boolean", (done) => {
      payload.confirm = "do it";
      server
        .delete(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "confirm must be a boolean"
        }, done);
    });

    it("should reject requests when confirm is not true", (done) => {
      payload.confirm = false;
      server
        .delete(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "confirm must be set to true to remove this record"
        }, done);
    });

    it("should successfully remove the requested story", (done) => {
      server
        .delete(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(200, {
          message: "story has been successfully deleted"
        }, done);
    });
  });
});
