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

describe("[Priority] Remove", () => {
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
      confirm: true
    };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });
  
  describe("DELETE /projects/:projectId/priorities/:priorityId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .delete("/projects/someProjectId/priorities/somePriorityId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .delete(`/projects/[Invalid]/priorities/somePriorityId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .delete(`/projects/impossibleId/priorities/somePriorityId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the priorityId slug is invalid", (done) => {
      server
        .delete(`/projects/${testProject._id}/priorities/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "priority id is not valid"
        }, done);
    });

    it("should reject requests when the requested priority is not found", (done) => {
      server
        .delete(`/projects/${testProject._id}/priorities/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested priority not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .delete(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without manager permissions", (done) => {
      server
        .delete(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenViewer)
        .expect(401, {
          error: "you must have manager permissions to perform this action"
        }, done);
    });


    it("should reject requests that are missing confirm input", (done) => {
      payload.confirm = undefined;
      server
        .delete(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "confirm is missing from input"
        }, done);
    });

    it("should reject requests when confirm is not a boolean", (done) => {
      payload.confirm = "do it";
      server
        .delete(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "confirm must be a boolean"
        }, done);
    });

    it("should reject requests when confirm is not true", (done) => {
      payload.confirm = false;
      server
        .delete(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "confirm must be set to true to remove this record"
        }, done);
    });

    it("should successfully delete a priority", (done) => {
      server
        .delete(`/projects/${testProject._id}/priorities/${testPriority1._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200, {
          message: "priority has been successfully deleted"
        }, done);
    });
  });
});
