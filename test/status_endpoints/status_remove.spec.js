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

describe("[Status] Remove", () => {
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
      confirm: true
    };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });
  
  describe("DELETE /projects/:projectId/status/:statusId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .delete("/projects/someProjectId/status/someStatusId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .delete(`/projects/[Invalid]/status/someStatusId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .delete(`/projects/impossibleId/status/someStatusId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the statusId slug is invalid", (done) => {
      server
        .delete(`/projects/${testProject._id}/status/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "status id is not valid"
        }, done);
    });

    it("should reject requests when the requested status is not found", (done) => {
      server
        .delete(`/projects/${testProject._id}/status/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested status not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .delete(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without manager permissions", (done) => {
      server
        .delete(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenViewer)
        .expect(401, {
          error: "you must have manager permissions to perform this action"
        }, done);
    });


    it("should reject requests that are missing confirm input", (done) => {
      payload.confirm = undefined;
      server
        .delete(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "confirm is missing from input"
        }, done);
    });

    it("should reject requests when confirm is not a boolean", (done) => {
      payload.confirm = "do it";
      server
        .delete(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "confirm must be a boolean"
        }, done);
    });

    it("should reject requests when confirm is not true", (done) => {
      payload.confirm = false;
      server
        .delete(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "confirm must be set to true to remove this record"
        }, done);
    });

    it("should successfully delete a status", (done) => {
      server
        .delete(`/projects/${testProject._id}/status/${testStatus1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200, {
          message: "status has been successfully deleted"
        }, done);
    });
  });
});
