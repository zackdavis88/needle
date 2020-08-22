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

describe("[Status] Get One", () => {
  let authTokenViewer;
  let authTokenAdmin;
  let authTokenNoPermission;
  let authTokenNonMember;
  let testProjectPrivate;
  let testProjectPublic;
  let testStatusPrivate;
  let testStatusPublic;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userViewer) => {
        createTestUser("Password1", (userNoPermission) => {
          createTestUser("Password1", (userNonMember) => {
            createTestProject(true, userAdmin, (privateProject) => {
              createTestProject(false, userAdmin, (publicProject) => {
                createTestMembership(privateProject, userViewer, {isViewer: true}, () => {
                  createTestMembership(privateProject, userNoPermission, {isViewer: false}, () => {
                    createTestStatus(privateProject, (privateStatus) => {
                      createTestStatus(publicProject, (publicStatus) => {
                        testStatusPrivate = privateStatus;
                        testStatusPublic = publicStatus;
                        testProjectPrivate = privateProject;
                        testProjectPublic = publicProject;
                        authTokenAdmin = generateToken(userAdmin);
                        authTokenViewer = generateToken(userViewer);
                        authTokenNoPermission = generateToken(userNoPermission);
                        authTokenNonMember = generateToken(userNonMember);
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
  });

  after(done => {
    cleanupTestRecords(done);
  });
  
  describe("GET /projects/:projectId/status/:statusId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/projects/someProjectId/status/someStatusId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .get(`/projects/[Invalid]/status/someStatusId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .get(`/projects/impossibleId/status/someStatusId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests when the statusId slug is invalid", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/status/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "status id is not valid"
        }, done);
    });

    it("should reject requests when the requested status is not found", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/status/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested status not found"
        }, done);
    });

    it("should reject requests from non-members for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/status/${testStatusPrivate._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without viewer permissions for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/status/${testStatusPrivate._id}`)
        .set("x-needle-token", authTokenNoPermission)
        .expect(401, {
          error: "you must have viewer permissions to perform this action"
        }, done);
    });

    it("should successfully return the requested status", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/status/${testStatusPrivate._id}`)
        .set("x-needle-token", authTokenViewer)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);

          const { message, status } = res.body;
          assert.equal(message, "status has been successfully retrieved");
          assert(status);
          const {id, name, project, createdOn} = status;
          assert.equal(id, testStatusPrivate._id);
          assert.equal(name, testStatusPrivate.name);
          assert(project);
          assert.equal(project.id, testProjectPrivate._id);
          assert.equal(project.name, testProjectPrivate.name);
          assert(createdOn);
          done();
        });
    });

    it("should successfully return the requested status to any user for public projects", (done) => {
      server
        .get(`/projects/${testProjectPublic._id}/status/${testStatusPublic._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(200, done);
    });
  });
});
