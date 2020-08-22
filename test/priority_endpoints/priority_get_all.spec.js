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

describe("[Priority] Get All", () => {
  let authTokenViewer;
  let authTokenAdmin;
  let authTokenNoPermission;
  let authTokenNonMember;
  let testProjectPrivate;
  let testProjectPublic;
  let testPriority;
  before(done => {
    createTestUser("Password1", (userAdmin) => {
      createTestUser("Password1", (userViewer) => {
        createTestUser("Password1", (userNoPermission) => {
          createTestUser("Password1", (userNonMember) => {
            createTestProject(true, userAdmin, (privateProject) => {
              createTestProject(false, userAdmin, (publicProject) => {
                createTestMembership(privateProject, userViewer, {isViewer: true}, () => {
                  createTestMembership(privateProject, userNoPermission, {isViewer: false}, () => {
                    createTestPriority(privateProject, (priority) => {
                      createTestPriority(privateProject, () => {
                        createTestPriority(privateProject, () => {
                          testPriority = priority;
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
  });

  after(done => {
    cleanupTestRecords(done);
  });
  
  describe("GET /projects/:projectId/priorities", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/projects/someProjectId/priorities")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .get(`/projects/[Invalid]/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .get(`/projects/impossibleId/priorities`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/priorities`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without viewer permissions for private projects", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/priorities`)
        .set("x-needle-token", authTokenNoPermission)
        .expect(401, {
          error: "you must have viewer permissions to perform this action"
        }, done);
    });

    it("should successfully return a paginated list of priorities", (done) => {
      server
        .get(`/projects/${testProjectPrivate._id}/priorities`)
        .set("x-needle-token", authTokenViewer)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);

          const { message, page, itemsPerPage, totalPages, project, priorities } = res.body;
          assert.equal(message, "priorities list has been successfully retrieved");
          assert.equal(page, 1);
          assert.equal(itemsPerPage, 10);
          assert.equal(totalPages, 1);
          assert(project);
          assert.equal(project.id, testProjectPrivate._id);
          assert.equal(project.name, testProjectPrivate.name);
          assert(priorities);
          assert.equal(priorities.length, 3);
          const priority = priorities[0];
          assert(priority);
          assert.equal(priority.id, testPriority._id);
          assert.equal(priority.name, testPriority.name);
          assert(priority.createdOn);
          done();
        });
    });

    it("should successfully return a paginated list of priorities to any user for public projects", (done) => {
      server
        .get(`/projects/${testProjectPublic._id}/priorities`)
        .set("x-needle-token", authTokenNonMember)
        .expect(200, done);
    });
  });
});
