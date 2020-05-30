import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestMembership,
  generateToken
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Project] Remove", () => {
  let authTokenAdmin;
  let authTokenManager;
  let authTokenNonMember;
  let testProject;
  let payload;
  before(done => {
    createTestUser("Password1", (admin) => {
      createTestUser("Password1", (manager) => {
        createTestUser("Password1", (nonmember) => {
          createTestProject(false, admin, (project) => {
            createTestMembership(project, manager, {isManager: true}, () => {
              authTokenAdmin = generateToken(admin);
              authTokenManager = generateToken(manager);
              authTokenNonMember = generateToken(nonmember);
              testProject = project;
              done();
            });
          });
        });
      });
    });
  });

  beforeEach(done => {
    payload = { confirm: testProject.name };
    done();
  });

  after(done => {
    cleanupTestRecords(done);
  });

  describe("DELETE /projects/:projectId", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .delete(`/projects/someId`)
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the projectId slug is invalid", (done) => {
      server
        .delete(`/projects/[Invalid]`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "project id is not valid"
        }, done);
    });

    it("should reject requests when the requested project is not found", (done) => {
      server
        .delete(`/projects/impossibleId`)
        .set("x-needle-token", authTokenAdmin)
        .expect(404, {
          error: "requested project not found"
        }, done);
    });

    it("should reject requests from non-members", (done) => {
      server
        .delete(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenNonMember)
        .expect(401, {
          error: "you must be a project member to perform this action"
        }, done);
    });

    it("should reject requests from members without admin permissions", (done) => {
      server
        .delete(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenManager)
        .expect(401, {
          error: "you must have admin permissions to perform this action"
        }, done);
    });

    it("should reject when confirm is missing from input", (done) => {
      payload.confirm = undefined;
      server
        .delete(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenAdmin)
        .expect(400, {
          error: "confirm is missing from input"
        }, done);
    });

    it("should reject when confirm is not a string", (done) => {
      payload.confirm = true;
      server
        .delete(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: "confirm must be a string"
        }, done);
    });

    it("should reject when confirm does not match the project name", (done) => {
      payload.confirm = "Something Wrong";
      server
        .delete(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(400, {
          error: `confirm input must match name: ${testProject.name}`
        }, done);
    });

    it("should successfully remove the requested project", (done) => {
      server
        .delete(`/projects/${testProject._id}`)
        .set("x-needle-token", authTokenAdmin)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const { message, project } = res.body;
          assert.equal(message, "project has been successfully deleted");
          assert(project);
          assert.equal(project.id, testProject._id);
          assert(project.deletedOn);
          assert.equal(project.isActive, false);
          done();
        });
    });
  });
});
