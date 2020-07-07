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

describe("[Dashboard] Get", () => {
  let authToken;
  let testProject1;
  let testProject2;
  let testProject3;
  let testStory1;
  let testStory2;
  let testStory3;
  let testStory4;
  before(done => {
    createTestUser("Password1", (user) => {
      createTestProject(false, user, (project1) => {
        createTestProject(true, user, (project2) => {
          createTestProject(false, user, (project3) => {
            createTestStory(project1, user, user, (story1) => {
              createTestStory(project3, user, user, (story2) => {
                createTestStory(project2, user, user, (story3) => {
                  createTestStory(project3, user, user, (story4) => {
                    authToken = generateToken(user);
                    testProject1 = project1;
                    testProject2 = project2;
                    testProject3 = project3;
                    testStory1 = story1;
                    testStory2 = story2;
                    testStory3 = story3;
                    testStory4 = story4;
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

  after(done => {
    cleanupTestRecords(done);
  });

  describe("GET /dashboard", () => {
    it("should reject requests when x-needle-token is invalid", (done) => {
      server
        .get("/projects/someProjectId/memberships/someMembershipId")
        .expect(400, {
          error: "x-needle-token header is missing from input"
        }, done);
    });

    it("should successfully return dashboard details", (done) => {
      server
        .get("/dashboard")
        .set("x-needle-token", authToken)
        .expect(200)
        .end((err, res) => {
          if(err)
            return done(err);
          
          const {message, projects, stories} = res.body;
          assert.equal(message, "user dashboard has been successfully retrieved");
          assert(projects);
          assert.equal(projects.length, 3);
          assert(stories);
          assert.equal(stories.length, 4);
          done();
        });
    });
  });
});
