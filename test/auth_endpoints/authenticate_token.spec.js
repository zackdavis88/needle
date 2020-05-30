import supertest from "supertest";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  generateToken
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Auth] Authenticate Token", () => {
  let testUser;
  let authToken;
  before((done) => {
    createTestUser("Password1", (user) => {
      testUser = user;
      authToken = generateToken(testUser);
      done();
    });
  });

  after((done) => {
    cleanupTestRecords(done);
  });

  describe("GET /auth/token", () => {
    it("should reject requests when x-needle-token is missing from input", (done) => {
      server
        .get("/auth/token")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should reject requests when x-needle-token is expired", (done) => {
      const tokenOverrides = {
        iat: Math.floor(Date.now() / 1000) - (60*61*10),
        exp: Math.floor(Date.now() / 1000)
      };
      const jwtToken = generateToken(testUser, tokenOverrides);
      server
        .get("/auth/token")
        .set("x-needle-token", jwtToken)
        .expect(403, {
          error: "x-needle-token is expired"
        }, done);
    });
    
    it("should reject requests when x-needle-token is invalid", (done) => {
      // A Token is invalid when it has been encrypted using the wrong secret-key.
      const secretOverride = 'badSecret';
      const jwtToken = generateToken(testUser, {}, secretOverride);
      server
        .get("/auth/token")
        .set("x-needle-token", jwtToken)
        .expect(403, {
          error: "x-needle-token is invalid"
        }, done);
    });

    it("should reject requests when x-needle-token does not contain expected fields", (done) => {
      const tokenOverrides = {apiKey: undefined};
      const jwtToken = generateToken(testUser, tokenOverrides);
      server
        .get("/auth/token")
        .set("x-needle-token", jwtToken)
        .expect(403, {
          error: "x-needle-token is missing required fields"
        }, done);
    });
    
    it("should reject requests when the x-needle-token _id field is invalid", (done) => {
      const tokenOverrides = {_id: "something_wrong"};
      const jwtToken = generateToken(testUser, tokenOverrides);
      server
        .get("/auth/token")
        .set("x-needle-token", jwtToken)
        .expect(400, {
          error: "x-needle-token contains an invalid id"
        }, done);
    });
    
    it("should reject requests when the x-needle-token apiKey is wrong", (done) => {
      const tokenOverrides = {apiKey: "something-wrong-and-bad"};
      const jwtToken = generateToken(testUser, tokenOverrides);
      server
        .get("/auth/token")
        .set("x-needle-token", jwtToken)
        .expect(403, {
          error: "x-needle-token user could not be authenticated"
        }, done);
    });

    it("should reject requests when the x-needle-token id is wrong", (done) => {
      const tokenOverrides = {_id: "microsoft123"};
      const jwtToken = generateToken(testUser, tokenOverrides);
      server
        .get("/auth/token")
        .set("x-needle-token", jwtToken)
        .expect(403, {
          error: "x-needle-token user could not be authenticated"
        }, done);
    });

    it("should successfully authenticate a token", (done) => {
      const jwtToken = generateToken(testUser);
      server
        .get("/auth/token")
        .set("x-needle-token", jwtToken)
        .expect(200, {
          message: "user successfully authenticated via token"
        }, done);
    });
  });
});
