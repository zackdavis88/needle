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

describe("[Status] All Names", () => {
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
  
  describe("GET /projects/:projectId/status/all", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/projects/someProjectId/status/all")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .get(`/projects/[Invalid]/status/all`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .get(`/projects/impossibleId/status/all`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .get(`/projects/${testProject._id}/status/all`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without developer permissions", (done) => {
      server
        .get(`/projects/${testProject._id}/status/all`)
        .set("x-needle-token", authTokenViewer)
        .expect(401, {
          error: "you must have developer permissions to perform this action"
        }, done);
    });

    it("should successfully retrieve a list of all status names", (done) => {
      server
        .get(`/projects/${testProject._id}/status/all`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, status} = res.body;
          assert.equal(message, "status names have been successfully retrieved");
          assert(status);
          assert.equal(status.length, 2);
          assert.equal(status[0], testStatus1.name);
          assert.equal(status[1], testStatus2.name);
          done();
        });
    });
  });
});
