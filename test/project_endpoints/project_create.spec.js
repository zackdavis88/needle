import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  generateToken,
  addProjectIdForCleanup,
  getTestMembership
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Project] Create", function(){
  let testUser;
  let authToken;
  let postData;
  before((done) => {
    createTestUser("Password1", (user) => {
      testUser = user;
      authToken = generateToken(testUser);
      done();
    });
  });

  beforeEach((done) => {
    postData = {
      name: "UNIT TEST Project",
      description: "Created via unit test automation",
      isPrivate: true
    };
    done();
  });

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("POST /projects", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .post("/projects")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests that are missing name input", (done) => {
      postData.name = undefined;
      server
        .post("/projects")
        .set("x-needle-token", authToken)
        .send(postData)
        .expect(400, {
          error: "name is missing from input"
        }, done);
    });

    it("should reject requests when name is not a string", (done) => {
      postData.name = {something: "invalid"};
      server
        .post("/projects")
        .set("x-needle-token", authToken)
        .send(postData)
        .expect(400, {
          error: "name must be a string"
        }, done);
    });

    it("should reject requests when name is under 3 characters", (done) => {
      postData.name = "z";
      server
        .post("/projects")
        .set("x-needle-token", authToken)
        .send(postData)
        .expect(400, {
          error: "name must be 3 - 50 characters in length"
        }, done);
    });

    it("should reject requests when name is over 50 characters", (done) => {
      postData.name = "abcdefghijklmnopqrstuvwxyz-_+=&^%$#@!/|{}()0123456789";
      server
        .post("/projects")
        .set("x-needle-token", authToken)
        .send(postData)
        .expect(400, {
          error: "name must be 3 - 50 characters in length"
        }, done);
    });

    it("should reject requests when name contains invalid characters", (done) => {
      postData.name = "abc-_+=&^%$#@!/|{}()?.,<>;':\"*]";
      server
        .post("/projects")
        .set("x-needle-token", authToken)
        .send(postData)
        .expect(400, {
          error: "name contains invalid characters"
        }, done);
    });

    it("should reject requests when description is not a string", (done) => {
      postData.description = false;
      server
        .post("/projects")
        .set("x-needle-token", authToken)
        .send(postData)
        .expect(400, {
          error: "description must be a string"
        }, done);
    });

    it("should reject requests when description is over 350 characters", (done) => {
      postData.description = new Array(351).fill("a").join("");
      server
        .post("/projects")
        .set("x-needle-token", authToken)
        .send(postData)
        .expect(400, {
          error: "description must be 350 characters or less"
        }, done);
    });

    it("should reject requests when isPrivate input is not a boolean", (done) => {
      postData.isPrivate = "private please";
      server
        .post("/projects")
        .set("x-needle-token", authToken)
        .send(postData)
        .expect(400, {
          error: "isPrivate must be a boolean"
        }, done);
    });

    it("should successfully create a project", (done) => {
      server
        .post("/projects")
        .set("x-needle-token", authToken)
        .send(postData)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {
            id,
            name,
            description,
            isPrivate,
            createdOn
          } = res.body.project;
          assert.equal(res.body.message, "project has been successfully created");
          assert(id);
          assert.equal(name, postData.name);
          assert.equal(description, postData.description);
          assert.equal(isPrivate, postData.isPrivate);
          assert(createdOn);
          addProjectIdForCleanup(id);
          getTestMembership(id, testUser._id, (membership) => {
            assert(membership);
            assert.equal(membership.project.toString(), id.toString());
            assert.equal(membership.user.toString(), testUser._id.toString());
            assert.equal(membership.roles.isAdmin, true);
            assert(membership.createdOn);
            done();
          });
        });
    });
  });
});

