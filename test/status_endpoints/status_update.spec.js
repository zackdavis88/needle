import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  createTestStatus,
  generateToken,
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Status] Update", () => {
  let authTokenAdmin;
  let authTokenViewer;
  let authTokenNonMember;
  let testProject;
  let testStatus1;
  let testStatus2;
  let payload;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userViewer) => {
        createTestUser("Password1", (userNonMember) => {
          createTestProject(true, userAdmin, (project) => {
            createTestMembership(project, userViewer, {isViewer: true}, () => {
              createTestStatus(project, (status1) => {
                createTestStatus(project, (status2) => {
                  authTokenAdmin = generateToken(userAdmin);
                  authTokenViewer = generateToken(userViewer);
                  authTokenNonMember = generateToken(userNonMember);
                  testProject = project;
                  testStatus1 = status1;
                  testStatus2 = status2;
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
      name: "Test Status Updated",
      color: "#000000"
    };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });
  
  describe("POST /projects/:projectId/status/:statusId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .post("/projects/someProjectId/status/someStatusId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .post(`/projects/[Invalid]/status/someStatusId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .post(`/projects/impossibleId/status/someStatusId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the statusId slug is invalid", (done) => {
      server
        .post(`/projects/${testProject._id}/status/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "status id is not valid"
        }, done);
    });

    it("should reject requests when the requested status is not found", (done) => {
      server
        .post(`/projects/${testProject._id}/status/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested status not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without manager permissions", (done) => {
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenViewer)
        .expect(401, {
          error: "you must have manager permissions to perform this action"
        }, done);
    });

    it("should reject requests when name input is not a string", (done) => {
      payload.name = 342342;
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name must be a string"
        }, done);
    });

    it("should reject requests when name is less than 1 character", (done) => {
      payload.name = "";
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name must be 1 - 26 characters in length"
        }, done);
    });

    it("should reject requests when name is over than 26 characters", (done) => {
      payload.name = "this is a very long name that will be invalid";
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name must be 1 - 26 characters in length"
        }, done);
    });

    it("should reject requests when name contains invalid characters", (done) => {
      payload.name = "abc&^%!/|{}()?.,<>;':\"*]";
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name contains invalid characters"
        }, done);
    });

    it("should reject requests when name is already taken", (done) => {
      payload.name = testStatus2.name;
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "name is already taken"
        }, done);
    });

    it("should not reject requests when name is already taken by the status being updated", (done) => {
      payload.name = testStatus1.name;
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200, done);
    });

    it("should reject requests when color is not a string", (done) => {
      payload.color = {some: "color"};
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "color must be a string"
        }, done);
    });

    it("should reject requests when color is not a valid format", (done) => {
      payload.color = "red";
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "color has invalid format. example #000000"
        }, done);
    });

    it("should successfully update the requested status", (done) => {
      server
        .post(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, status} = res.body;
          assert.equal(message, "status has been successfully updated");
          assert(status);
          const {id, name, project, createdOn, updatedOn} = status;
          assert.equal(id, testStatus1._id);
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
