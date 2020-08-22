import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  createTestPriority,
  generateToken,
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Priority] Update", () => {
  let authTokenAdmin;
  let authTokenViewer;
  let authTokenNonMember;
  let testProject;
  let testPriority1;
  let testPriority2;
  let payload;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userViewer) => {
        createTestUser("Password1", (userNonMember) => {
          createTestProject(true, userAdmin, (project) => {
            createTestMembership(project, userViewer, {isViewer: true}, () => {
              createTestPriority(project, (priority1) => {
                createTestPriority(project, (priority2) => {
                  authTokenAdmin = generateToken(userAdmin);
                  authTokenViewer = generateToken(userViewer);
                  authTokenNonMember = generateToken(userNonMember);
                  testProject = project;
                  testPriority1 = priority1;
                  testPriority2 = priority2;
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
    payload = {
      name: "Test Priority Updated",
      color: "#000000"
    };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });
  
  describe("POST /projects/:projectId/priorities/:priorityId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .post("/projects/someProjectId/priorities/somePriorityId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .post(`/projects/[Invalid]/priorities/somePriorityId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .post(`/projects/impossibleId/priorities/somePriorityId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the priorityId slug is invalid", (done) => {
      server
        .post(`/projects/${testProject._id}/priorities/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "priority id is not valid"
        }, done);
    });

    it("should reject requests when the requested priority is not found", (done) => {
      server
        .post(`/projects/${testProject._id}/priorities/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested priority not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .post(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without manager permissions", (done) => {
      server
        .post(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenViewer)
        .expect(401, {
          error: "you must have manager permissions to perform this action"
        }, done);
    });

    it("should reject requests when name input is not a string", (done) => {
      payload.name = 342342;
      server
        .post(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name must be a string"
        }, done);
    });

    it("should reject requests when name is less than 1 character", (done) => {
      payload.name = "";
      server
        .post(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name must be 1 - 26 characters in length"
        }, done);
    });

    it("should reject requests when name is over than 26 characters", (done) => {
      payload.name = "this is a very long name that will be invalid";
      server
        .post(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name must be 1 - 26 characters in length"
        }, done);
    });

    it("should reject requests when name contains invalid characters", (done) => {
      payload.name = "abc&^%!/|{}()?.,<>;':\"*]";
      server
        .post(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name contains invalid characters"
        }, done);
    });

    it("should reject requests when name is already taken", (done) => {
      payload.name = testPriority2.name;
      server
        .post(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name is already taken"
        }, done);
    });

    it("should reject requests when color is not a string", (done) => {
      payload.color = {some: "color"};
      server
        .post(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "color must be a string"
        }, done);
    });

    it("should reject requests when color is not a valid format", (done) => {
      payload.color = "red";
      server
        .post(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "color has invalid format. example #000000"
        }, done);
    });

    it("should successfully update the requested priority", (done) => {
      server
        .post(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, priority} = res.body;
          assert.equal(message, "priority has been successfully updated");
          assert(priority);
          const {id, name, project, createdOn, updatedOn} = priority;
          assert.equal(id, testPriority1._id);
          assert.equal(name, payload.name);
          assert(project);
          assert.equal(project.id, testProject._id);
          assert.equal(project.name, testProject.name);
          assert(createdOn);
          assert(updatedOn);
          done();
        });
    });
  });
});
