import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  generateToken
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);
import Membership from "../../src/models/membership";

describe("[User] Remove", () => {
  let testUser1;
  let testUser2;
  let authToken;
  let payload;
  before((done) => {
    createTestUser("Password1", (user1) => {
      createTestUser("Password1", (user2) => {
        createTestProject(false, user1, () => {
          testUser1 = user1;
          testUser2 = user2;
          authToken = generateToken(testUser1);
          done();
        });
      });
    });
  });

  beforeEach((done) => {
    payload = {confirm: testUser1.username};
    done();
  });

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("DELETE /users/:username" , () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .delete(`/users/${testUser2.username}`)
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when a user tries to remove a different user", (done) => {
      server
        .delete(`/users/${testUser2.username}`)
        .set("x-needle-token", authToken)
        .expect(401, {
          error: "you do not have permission to perform this action"
        }, done);
    });

    it("should reject requests when confirm is missing from input", (done) => {
      payload.confirm = undefined;
      server
        .delete(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "confirm is missing from input"
        }, done);
    });

    it("should reject requests when confirm is not a string", (done) => {
      payload.confirm = true;
      server
        .delete(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(400, {
          error: "confirm must be a string"
        }, done);
    });

    it("should reject requests when confirm does not match their username", (done) => {
      server
        .delete(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send({confirm: "do it"})
        .expect(400, {
          error: `confirm input must match username: ${testUser1.username}`
        }, done);
    });

    it("should successfully delete a user", (done) => {
      server
        .delete(`/users/${testUser1.username}`)
        .set("x-needle-token", authToken)
        .send(payload)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, user} = res.body;
          assert.equal(message, "user has been successfully deleted");
          assert(user);
          const {
            username,
            displayName,
            isActive,
            createdOn,
            deletedOn
          } = user;
          assert.equal(username, testUser1.username);
          assert.equal(displayName, testUser1.displayName);
          assert.equal(isActive, false);
          assert(createdOn);
          assert(deletedOn);

          // This user has an admin membership setup in before();
          // Ensure that the user has no memberships after being deleted.
          Membership.find({user: testUser1._id}, (err, memberships) => {
            if(err)
              return done(err);
            assert(memberships.length === 0);
            done();
          });
        });
    });
  });
});
