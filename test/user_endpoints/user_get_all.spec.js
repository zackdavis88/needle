import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  generateToken
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[User] Get All", function(){
  let testUser;
  let authToken;
  before((done) => {
    createTestUser("Password1", (user) => {
      createTestUser("Password1", () => {
        createTestUser("Password1", () => {
          createTestUser("Password1", () => {
            createTestUser("Password1", () => {
              testUser = user;
              authToken = generateToken(testUser);
              done();
            });
          });
        });
      });
    });
  });

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("GET /users", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/users")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should successfully return a paginated list of users", (done) => {
      server
        .get("/users?itemsPerPage=1&page=3")
        .set("x-needle-token", authToken)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {
            message,
            users,
            page,
            itemsPerPage,
            totalPages
          } = res.body;

          assert.equal(message, "user list has been successfully retrieved");
          assert.equal(page, 3);
          assert.equal(totalPages, 5);
          assert.equal(itemsPerPage, 1);
          assert(users);
          const user = users[0];
          const {
            _id,
            hash,
            apiKey,
            username,
            displayName,
            createdOn
          } = user;

          assert(!_id);
          assert(!hash);
          assert(!apiKey);
          assert(username);
          assert(displayName);
          assert(createdOn);
          done();
        });
    });
  });
});
