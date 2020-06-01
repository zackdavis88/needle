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

describe("[Story] Update", () => {
  let authTokenDeveloper;
  let authTokenViewer;
  let authTokenNonMember;
  let testUserDeveloper;
  let testUserViewer;
  let testUserNonMember;
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
                  createTestStory(project, userDeveloper, null, (story) => {
                    authTokenDeveloper = generateToken(userDeveloper);
                    authTokenViewer = generateToken(userViewer);
                    authTokenNonMember = generateToken(userNonMember);
                    testUserDeveloper = userDeveloper;
                    testUserViewer = userViewer;
                    testUserNonMember = userNonMember;
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
    payload = {
      name: "UNIT TEST Story (Updated)",
      details: "Updated via unit test automation",
      owner: testUserDeveloper.displayName
    };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });
  
  describe("POST /projects/:projectId/stories/:storyId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .post("/projects/someProjectId/stories/someStoryId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .post(`/projects/[Invalid]/stories/someStoryId`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .post(`/projects/impossibleId/stories/someStoryId`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the storyId slug is invalid", (done) => {
      server
        .post(`/projects/${testProject._id}/stories/[Invalid]`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(400, {
          error: "story id is not valid"
        }, done);
    });

    it("should reject requests when the requested story is not found", (done) => {
      server
        .post(`/projects/${testProject._id}/stories/impossibleId`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(404, {
          error: "requested story not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without developer permissions", (done) => {
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenViewer)
        .expect(401, {
          error: "you must have developer permissions to perform this action"
        }, done);
    });

    it("should reject requests when name is not a string", (done) => {
      payload.name = {something: "invalid"};
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "name must be a string"
        }, done);
    });

    it("should reject requests when name is under 1 character", (done) => {
      payload.name = "";
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "name must be 1 - 300 characters in length"
        }, done);
    });

    it("should reject requests when name is over 300 characters", (done) => {
      payload.name = new Array(301).fill("a").join("");
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "name must be 1 - 300 characters in length"
        }, done);
    });

    it("should reject requests when name contains invalid characters", (done) => {
      payload.name = "abc-_+=&^%$#@!/|{}()?.,<>;':\"*]";
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "name contains invalid characters"
        }, done);
    });

    it("should reject requests when details is not a string", (done) => {
      payload.details = false;
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "details must be a string"
        }, done);
    });

    it("should reject requests when details is over 2000 characters", (done) => {
      payload.details = new Array(2001).fill("a").join("");
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "details must be 2000 characters or less"
        }, done);
    });

    it("should reject requests when owner is not a string", (done) => {
      payload.owner = false;
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "owner must be a string"
        }, done);
    });

    it("should reject requests when the requested owner does not exist", (done) => {
      payload.owner = "doe$NotExist";
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "requested owner does not exist"
        }, done);
    });

    it("should reject requests when the requested owner is not a project member", (done) => {
      payload.owner = testUserNonMember.displayName;
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "requested owner is not a member of this project"
        }, done);
    });

    it("should successfully update a story", (done) => {
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const { message, story } = res.body;
          assert.equal(message, "story has been successfully updated");
          assert(story);
          const { id, name, details, creator, owner, project, createdOn, updatedOn } = story;
          assert.equal(id, testStory._id.toString());
          assert.equal(name, payload.name);
          assert.equal(details, payload.details);
          assert(creator);
          assert.equal(creator.username, testUserDeveloper.username);
          assert.equal(creator.displayName, testUserDeveloper.displayName);
          assert(owner);
          assert.equal(owner.username, testUserDeveloper.username);
          assert.equal(owner.displayName, testUserDeveloper.displayName);
          assert(project);
          assert.equal(project.id, testProject._id.toString());
          assert.equal(project.name, testProject.name);
          assert(createdOn);
          assert(updatedOn);
          done();
        });
    });

    it("should successfully remove details or owner fields if requested", (done) => {
      payload.details = "";
      payload.owner = "";
      server
        .post(`/projects/${testProject._id}/stories/${testStory._id}`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const { message, story } = res.body;
          assert.equal(message, "story has been successfully updated");
          assert(story);
          const { id, details, owner } = story;
          assert.equal(id, testStory._id.toString());
          assert.equal(details, null);
          assert.equal(owner, null);
          done();
        });
    });
  });
});
