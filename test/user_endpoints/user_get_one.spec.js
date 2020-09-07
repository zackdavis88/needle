import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  generateToken
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[User] Get One", () => {
  let testUser1;
  let testUser2;
  let authToken;
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

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("GET /users/:username", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get(`/users/${testUser2.username}`)
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when the requested user is not found", (done) => {
      server
        .get(`/users/$omeoneWhoCantExist`)
        .set("x-needle-token", authToken)
        .expect(404, {
          error: "requested user not found"
        }, done);
    });

    it("should successfully return user details", (done) => {
      server
        .get(`/users/${testUser2.username}`)
        .set("x-needle-token", authToken)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);

          const {message, user} = res.body;
          assert.equal(message, "user has been successfully retrieved");
          assert(user);
          const {
            _id,
            username,
            displayName,
            hash,
            apiKey,
            createdOn
          } = user;
          assert(!_id);
          assert(!hash);
          assert(!apiKey);
          assert.equal(username, testUser2.username);
          assert.equal(displayName, testUser2.displayName);
          assert(createdOn);
          done();
        });
    });
  });
});
