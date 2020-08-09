import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestStory,
  generateToken,
} from "../utils";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Dashboard] Get Stories", () => {
  let authToken;
  before(done => {
    createTestUser("Password1", (user) => {
      createTestProject(false, user, (project1) => {
        createTestProject(true, user, (project2) => {
          createTestProject(false, user, (project3) => {
            createTestStory(project1, user, null, () => {
              createTestStory(project1, user, null, () => {
                createTestStory(project2, user, null, () => {
                  createTestStory(project2, user, null, () => {
                    createTestStory(project3, user, null, () => {
                      createTestStory(project3, user, null, () => {
                        project3.isActive = false;
                        project3.save(() => {
                          authToken = generateToken(user);
                          done();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  after(done => {
    cleanupTestRecords(done);
  });

  describe("GET /dashboard/stories", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/dashboard/stories")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should successfully return dashboard stories details", (done) => {
      server
        .get("/dashboard/stories")
        .set("x-needle-token", authToken)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, stories} = res.body;
          assert.equal(message, "dashboard stories successfully retrieved");
          assert(stories);
          assert.equal(stories.length, 4);
          done();
        });
    });
  });
});
