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

describe("[User] Create", function(){
  const randomUsername = mongoose.Types.ObjectId().toString().toUpperCase();
  let postData;
  let existingUser;
  before((done) => {
    createTestUser("Password1", (user) => {
      existingUser = user;
      done();
    });
  });

  beforeEach((done) => {
    postData = {username: randomUsername, password: "Password1"};
    done();
  });

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("POST /users", () => {
    it("should reject requests when username is missing from input", (done) => {
      postData.username = undefined;
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "username is missing from input"
        }, done);
    });

    it("should reject requests when username is not a string", (done) => {
      postData.username = {something: "non-string"};
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "username must be a string"
        }, done);
    });

    it("should reject requests when username is under 3 characters in length", (done) => {
      postData.username = "ab";
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "username must be 3 - 26 characters in length"
        }, done);
    });

    it("should reject requests when username is over 26 characters in length", (done) => {
      postData.username = "abcdefghijklmnopqrstuvwxyza";
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "username must be 3 - 26 characters in length"
        }, done);
    });

    it("should reject requests when username contains invalid characters", (done) => {
      postData.username = "te$tCase";
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "username may only contain alphanumeric, - (dash), and _ (underscore) characters"
        }, done);
    });

    it("should reject requests when username is already taken", (done) => {
      postData.username = existingUser.displayName;
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "username is already taken"
        }, done);
    });

    it("should reject requests when password is missing from input", (done) => {
      postData.password = undefined;
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "password is missing from input"
        }, done);
    });

    it("should reject requests when password is not a string", (done) => {
      postData.password = 234273482734892748927;
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "password must be a string"
        }, done);
    });

    it("should reject requests when password is under 8 characters in length", (done) => {
      postData.password = "weak";
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "password must be at least 8 characters in length"
        }, done);
    });
  
    it("should reject requests when password does not contain an uppercase character", (done) => {
      postData.password = "password1";
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "password must have 1 uppercase, lowercase, and number character"
        }, done);
    });

    it("should reject requests when password does not contain an lowercase character", (done) => {
      postData.password = "PASSWORD1";
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "password must have 1 uppercase, lowercase, and number character"
        }, done);
    });
  
    it("should reject requests when password does not contain an numeric character", (done) => {
      postData.password = "PasswordOne";
      server
        .post("/users")
        .send(postData)
        .expect(400, {
          error: "password must have 1 uppercase, lowercase, and number character"
        }, done);
    });

    it("should successfully create a user", (done) => {
      server
        .post("/users")
        .send(postData)
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
          assert.equal(username, postData.username.toLowerCase());
          assert.equal(displayName, postData.username);
          assert(createdOn);
          done();
        });
    });
  });
});
