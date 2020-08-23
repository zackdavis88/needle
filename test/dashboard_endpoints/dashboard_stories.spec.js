import supertest from "supertest";
import assert from "assert";
import { port } from "../../config/app";
import {
  cleanupTestRecords,
  createTestUser,
  createTestProject,
  createTestStory,
  createTestPriority,
  generateToken,
} from "../utils";
import priority from "../../src/models/priority";
const server = supertest.agent(`https://localhost:${port}`);

describe("[Dashboard] Get Stories", () => {
  let authToken;
  let testStory;
  let testPriority;
  before(done => {
    createTestUser("Password1", (user) => {
      createTestProject(false, user, (project1) => {
        createTestProject(true, user, (project2) => {
          createTestProject(false, user, (project3) => {
            createTestPriority(project1, (priority) => {
              createTestStory(project1, user, null, priority, (story) => {
                createTestStory(project1, user, null, null, () => {
                  createTestStory(project2, user, null, null, () => {
                    createTestStory(project2, user, null, null, () => {
                      createTestStory(project3, user, null, null, () => {
                        createTestStory(project3, user, null, null, () => {
                          testStory = story;
                          testPriority = priority;
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

    it("should successfully return dashboard stories filtered by name", (done) => {
      server
        .get(`/dashboard/stories?filterName=${testStory.name}`)
        .set("x-needle-token", authToken)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, stories, page} = res.body;
          assert.equal(message, "dashboard stories successfully retrieved");
          assert.equal(page, 1);
          assert.equal(stories.length, 1);
          assert.equal(stories[0].name, testStory.name);
          assert(stories[0].priority);
          assert.equal(stories[0].priority.name, testPriority.name);
          done();
        });
    });
  });
});
