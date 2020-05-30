import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords, 
  createTestUser, 
  generateToken,
  getTestUser
} from "../utils";
import User from "../../src/models/user";
const server = supertest.agent(`https://localhost:${port}`);

describe("[User] Update", () => {
  let testUser1;
  let testUser2;
  let authToken;
  let payload;
  before((done) => {
    createTestUser("Password1", (user1) => {
      createTestUser("Password1", (user2) => {
        testUser1 = user1;
        testUser2 = user2;
        authToken = generateToken(testUser1);
        done();
      });
    });
  });

  beforeEach((done) => {
    payload = {password: "NewPassword1", currentPassword: "Password1"};
    done();
  });

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("POST /users/:username" , () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .post(`/users/${testUser2.username}`)
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when a user tries to update a different user", (done) => {
      server
        .post(`/users/${testUser2.username}`)
        .set("x-needle-token", authToken)
        .expect(401, {
          error: "you do not have permission to perform this action"
        }, done);
    });

    it("should reject requests when currentPassword is missing from input", (done) => {
      payload.currentPassword = undefined;
      server
        .post(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "current password is missing from input"
        }, done);
    });

    it("should reject requests when currentPassword is not a string", (done) => {
      payload.currentPassword = 234273482734892748927;
      server
        .post(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "current password must be a string"
        }, done);
    });

    it("should reject requests when currentPassword is invalid", (done) => {
      payload.currentPassword = "SomePasswordThatIsWrong"
      server
        .post(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "current password is invalid"
        }, done);
    });

    it("should reject requests when password is missing from input", (done) => {
      payload.password = undefined;
      server
        .post(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "password is missing from input"
        }, done);
    });

    it("should reject requests when password is not a string", (done) => {
      payload.password = {something: "non-string"};
      server
        .post(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "password must be a string"
        }, done);
    });

    it("should reject requests when password is under 8 characters in length", (done) => {
      payload.password = "weak";
      server
        .post(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "password must be at least 8 characters in length"
        }, done);
    });
  
    it("should reject requests when password does not contain an uppercase character", (done) => {
      payload.password = "password1";
      server
        .post(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "password must have 1 uppercase, lowercase, and number character"
        }, done);
    });

    it("should reject requests when password does not contain an lowercase character", (done) => {
      payload.password = "PASSWORD1";
      server
        .post(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "password must have 1 uppercase, lowercase, and number character"
        }, done);
    });
  
    it("should reject requests when password does not contain an numeric character", (done) => {
      payload.password = "PasswordOne";
      server
        .post(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "password must have 1 uppercase, lowercase, and number character"
        }, done);
    });

    it("should successfully update a user password", (done) => {
      server
        .post(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, user} = res.body;
          assert.equal(message, "password has been successfully updated");
          assert(user);
          const {
            username,
            displayName,
            createdOn,
            updatedOn
          } = user;
          assert.equal(username, testUser1.username);
          assert.equal(displayName, testUser1.displayName);
          assert(createdOn);
          assert(updatedOn);
          
          // Validate that the password actually changed.
          getTestUser(testUser1.username, (user) => {
            User.compareHash(payload.password, user.hash, (err, passwordIsValid) => {
              assert.equal(passwordIsValid, true);
              done();
            });
          });
        });
    });
  });
});
