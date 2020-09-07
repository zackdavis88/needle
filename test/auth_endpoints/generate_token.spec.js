import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Auth] Generate Token", () => {
  let testUser;
  before((done) => {
    createTestUser("Password1", (user) => {
      testUser = user;
      done();
    });
  });

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("GET /auth", () => {
    it("should reject requests when x-needle-basic header is missing from input", (done) => {
      server
        .get("/auth")
        .expect(400, {
          error: "x-needle-basic header is missing from input"
        }, done);
    });

    it("should reject requests when the x-needle-basic header does not use Basic Auth", (done) => {
      server
        .get("/auth")
        .set("x-needle-basic", "SomethingBadAndWrong")
        .expect(400, {
          error: "x-needle-basic must use Basic Auth"
        }, done);
    });

    it("should reject requests when the x-needle-basic header has an invalid Basic Auth credential format", (done) => {
      const encodedCreds = Buffer.from("username/password").toString("base64");
      const basicAuthHeader = `Basic ${encodedCreds}`;
      server
        .get("/auth")
        .set("x-needle-basic", basicAuthHeader)
        .expect(400, {
          error: "x-needle-basic credentials have invalid format"
        }, done);
    });

    it("should reject requests when the user does not exist", (done) => {
      const encodedCreds = Buffer.from("something:bad").toString("base64");
      const basicAuthHeader = `Basic ${encodedCreds}`;
      server
        .get("/auth")
        .set("x-needle-basic", basicAuthHeader)
        .expect(403, {
          error: "username and password combination is invalid"
        }, done);
    });

    it("should reject requests when the password is invalid", (done) => {
      const credentials = `${testUser.username}:WrongPass`;
      const encodedCreds = Buffer.from(credentials).toString("base64");
      const basicAuthHeader = `Basic ${encodedCreds}`;
      server
        .get("/auth")
        .set("x-needle-basic", basicAuthHeader)
        .expect(403, {
          error: "username and password combination is invalid"
        }, done);
    });

    it("should successfully generate an authentication token", (done) => {
      const credentials = `${testUser.username}:Password1`;
      const encodedCreds = Buffer.from(credentials).toString("base64");
      const basicAuthHeader = `Basic ${encodedCreds}`;
      server
        .get("/auth")
        .set("x-needle-basic", basicAuthHeader)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, user} = res.body;
          assert.equal(message, "user successfully authenticated");
          assert(res.headers["x-needle-token"]);
          assert(user);
          assert.equal(user.username, testUser.username);
          assert.equal(user.displayName, testUser.displayName);
          assert(user.createdOn);
          done();
        });
    });
  });
});
