import supertest from "supertest";
import assert from "assert";
import mongoose from "mongoose";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  addUsernameForCleanup
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[User] Create", () => {
  const randomUsername = mongoose.Types.ObjectId().toString().toUpperCase();
  let payload;
  let existingUser;
  before((done) => {
    createTestUser("Password1", (user) => {
      existingUser = user;
      done();
    });
  });

  beforeEach((done) => {
    payload = {username: randomUsername, password: "Password1"};
    done();
  });

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("POST /users", () => {
    it("should reject requests when username is missing from input", (done) => {
      payload.username = undefined;
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "username is missing from input"
        }, done);
    });

    it("should reject requests when username is not a string", (done) => {
      payload.username = {something: "non-string"};
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "username must be a string"
        }, done);
    });

    it("should reject requests when username is under 3 characters in length", (done) => {
      payload.username = "ab";
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "username must be 3 - 26 characters in length"
        }, done);
    });

    it("should reject requests when username is over 26 characters in length", (done) => {
      payload.username = "abcdefghijklmnopqrstuvwxyza";
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "username must be 3 - 26 characters in length"
        }, done);
    });

    it("should reject requests when username contains invalid characters", (done) => {
      payload.username = "te$tCase";
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "username may only contain alphanumeric, - (dash), and _ (underscore) characters"
        }, done);
    });

    it("should reject requests when username is already taken", (done) => {
      payload.username = existingUser.displayName;
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "username is already taken"
        }, done);
    });

    it("should reject requests when password is missing from input", (done) => {
      payload.password = undefined;
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "password is missing from input"
        }, done);
    });

    it("should reject requests when password is not a string", (done) => {
      payload.password = 234273482734892748927;
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "password must be a string"
        }, done);
    });

    it("should reject requests when password is under 8 characters in length", (done) => {
      payload.password = "weak";
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "password must be at least 8 characters in length"
        }, done);
    });
  
    it("should reject requests when password does not contain an uppercase character", (done) => {
      payload.password = "password1";
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "password must have 1 uppercase, lowercase, and number character"
        }, done);
    });

    it("should reject requests when password does not contain an lowercase character", (done) => {
      payload.password = "PASSWORD1";
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "password must have 1 uppercase, lowercase, and number character"
        }, done);
    });
  
    it("should reject requests when password does not contain an numeric character", (done) => {
      payload.password = "PasswordOne";
      server
        .post("/users")
        .send(payload)
        .expect(400, {
          error: "password must have 1 uppercase, lowercase, and number character"
        }, done);
    });

    it("should successfully create a user", (done) => {
      server
        .post("/users")
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const { message, user } = res.body;
          addUsernameForCleanup(user.username);
          assert.equal(message, "user has been successfully created");
          assert(user);
          const {
            username,
            displayName,
            createdOn
          } = user;
          assert.equal(username, payload.username.toLowerCase());
          assert.equal(displayName, payload.username);
          assert(createdOn);
          done();
        });
    });
  });
});
