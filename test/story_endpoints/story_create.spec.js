import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  createTestPriority,
  createTestStatus,
  generateToken
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Story] Create", () => {
  let authTokenDeveloper;
  let authTokenViewer;
  let authTokenNonMember;
  let testUserDeveloper;
  let testUserViewer;
  let testUserNonMember;
  let testProject;
  let testPriority;
  let testStatus;
  let payload;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userDeveloper) => {
        createTestUser("Password1", (userViewer) => {
          createTestUser("Password1", (userNonMember) => {
            createTestProject(false, userAdmin, (project) => {
              createTestMembership(project, userDeveloper, {isDeveloper: true}, () => {
                createTestMembership(project, userViewer, {isViewer: true}, () => {
                  createTestPriority(project, (priority) => {
                    createTestStatus(project, (status) => {
                      authTokenDeveloper = generateToken(userDeveloper);
                      authTokenViewer = generateToken(userViewer);
                      authTokenNonMember = generateToken(userNonMember);
                      testUserDeveloper = userDeveloper;
                      testUserViewer = userViewer;
                      testUserNonMember = userNonMember;
                      testProject = project;
                      testPriority = priority;
                      testStatus = status;
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

  beforeEach((done) => {
    payload = {
      name: "UNIT TEST Story",
      details: "Created via unit test automation",
      owner: testUserViewer.displayName
    };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });
  
  describe("POST /projects/:projectId/stories", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .post("/projects/someProjectId/stories")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .post(`/projects/[Invalid]/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .post(`/projects/impossibleId/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without developer permissions", (done) => {
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenViewer)
        .expect(401, {
          error: "you must have developer permissions to perform this action"
        }, done);
    });

    it("should reject requests that are missing name input", (done) => {
      payload.name = undefined;
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "name is missing from input"
        }, done);
    });

    it("should reject requests when name is not a string", (done) => {
      payload.name = {something: "invalid"};
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "name must be a string"
        }, done);
    });

    it("should reject requests when name is under 1 character", (done) => {
      payload.name = "";
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "name must be 1 - 100 characters in length"
        }, done);
    });

    it("should reject requests when name is over 100 characters", (done) => {
      payload.name = new Array(301).fill("a").join("");
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "name must be 1 - 100 characters in length"
        }, done);
    });

    it("should reject requests when name contains invalid characters", (done) => {
      payload.name = "abc-_+=&^%$#@!/|{}()?.,<>;':\"*]";
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "name contains invalid characters"
        }, done);
    });

    it("should reject requests when details is not a string", (done) => {
      payload.details = false;
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "details must be a string"
        }, done);
    });

    it("should reject requests when details is over 2000 characters", (done) => {
      payload.details = new Array(2001).fill("a").join("");
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "details must be 2000 characters or less"
        }, done);
    });

    it("should reject requests when owner is not a string", (done) => {
      payload.owner = false;
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "owner must be a string"
        }, done);
    });

    it("should reject requests when the requested owner does not exist", (done) => {
      payload.owner = "doe$NotExist";
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "requested owner does not exist"
        }, done);
    });

    it("should reject requests when the requested owner is not a project member", (done) => {
      payload.owner = testUserNonMember.displayName;
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "requested owner is not a member of this project"
        }, done);
    });

    it("should reject requests when points is not a number", (done) => {
      payload.points = "5";
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "points must be a number"
        }, done);
    });

    it("should reject requests when points is not an integer", (done) => {
      payload.points = 5.5;
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "points must be an integer"
        }, done);
    });

    it("should reject requests when points is under 0", (done) => {
      payload.points = -1;
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "points must be between 0 - 100"
        }, done);
    });

    it("should reject requests when points is over 100", (done) => {
      payload.points = 101;
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "points must be between 0 - 100"
        }, done);
    });

    it("should reject requests when priority is not a string", (done) => {
      payload.priority = 1;
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "priority must be a string"
        }, done);
    });

    it("should reject requests when the requested priority does not exist", (done) => {
      payload.priority = "something that doesnt exist";
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "requested priority does not exist"
        }, done);
    });

    it("should reject requests when status is not a string", (done) => {
      payload.status = 1;
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "status must be a string"
        }, done);
    });

    it("should reject requests when the requested status does not exist", (done) => {
      payload.status = "something that doesnt exist";
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(400, {
          error: "requested status does not exist"
        }, done);
    });

    it("should successfully create a story", (done) => {
      payload.points = 5;
      payload.priority = testPriority.name.toLowerCase(); // priority validation is not case sensitive.
      payload.status = testStatus.name.toUpperCase();
      server
        .post(`/projects/${testProject._id}/stories`)
        .set("x-needle-token", authTokenDeveloper)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const { message, story } = res.body;
          assert.equal(message, "story has been successfully created");
          assert(story);
          const { id, name, details, creator, owner, project, points, priority, status, createdOn } = story;
          assert(id);
          assert.equal(name, payload.name);
          assert.equal(details, payload.details);
          assert(creator);
          assert.equal(creator.username, testUserDeveloper.username);
          assert.equal(creator.displayName, testUserDeveloper.displayName);
          assert(owner);
          assert.equal(owner.username, testUserViewer.username);
          assert.equal(owner.displayName, testUserViewer.displayName);
          assert(project);
          assert.equal(project.id, testProject._id.toString());
          assert.equal(project.name, testProject.name);
          assert.equal(points, 5);
          assert(priority);
          assert.equal(priority.name, testPriority.name);
          assert.equal(priority.color, testPriority.color);
          assert(status);
          assert.equal(status.name, testStatus.name);
          assert.equal(status.color, testStatus.color);
          assert(createdOn);
          done();
        });
    });
  });
});
