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

describe("[Priority] All Names", () => {
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
  
  describe("GET /projects/:projectId/priorities/all", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/projects/someProjectId/priorities/all")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .get(`/projects/[Invalid]/priorities/all`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .get(`/projects/impossibleId/priorities/all`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .get(`/projects/${testProject._id}/priorities/all`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without developer permissions", (done) => {
      server
        .get(`/projects/${testProject._id}/priorities/all`)
        .set("x-needle-token", authTokenViewer)
        .expect(401, {
          error: "you must have developer permissions to perform this action"
        }, done);
    });

    it("should successfully retrieve a list of all priority names", (done) => {
      server
        .get(`/projects/${testProject._id}/priorities/all`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, priorities} = res.body;
          assert.equal(message, "priority names have been successfully retrieved");
          assert(priorities);
          assert.equal(priorities.length, 2);
          assert.equal(priorities[0], testPriority1.name);
          assert.equal(priorities[1], testPriority2.name);
          done();
        });
    });
  });
});
