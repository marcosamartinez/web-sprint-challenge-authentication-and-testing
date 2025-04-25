// Write your tests here
const server = require("./server.js");
const request = require("supertest");
const db = require("../data/dbConfig");

beforeAll(async () => {
  // await db('users').truncate();
  await db.migrate.rollback();
  await db.migrate.latest();
});

afterAll(async () => {
  await db.destroy();
});

describe("testing the api endpoints", () => {
  describe("testing the auth register endpoint", () => {
    it('missing password returns "username and password required"', async () => {
      await request(server)
        .post("/api/auth/register")
        .send({ username: "manny" })
        .expect({ message: "username and password required" });
    });

    it("check that new user is added to the database", async () => {
      let users = await db("users");
      expect(users).toHaveLength(0);

      const response = await request(server)
        .post("/api/auth/register")
        .send({ username: "manny", password: "mypassword" });

      // Actually use the response to check status
      expect(response.status).toBe(201);

      users = await db("users");
      expect(users).toHaveLength(1);
    });

    it("check that user is not added if username exists", async () => {
      // Create first user
      const firstResponse = await request(server)
        .post("/api/auth/register")
        .send({ username: "uniqueUser", password: "mypassword" });

      expect(firstResponse.status).toBe(201);

      let users = await db("users");
      const initialCount = users.length;

      // Try to create duplicate user
      const duplicateResponse = await request(server)
        .post("/api/auth/register")
        .send({ username: "uniqueUser", password: "mypassword" });

      expect(duplicateResponse.body).toEqual({ message: "username taken" });
      expect(duplicateResponse.status).toBe(400);

      users = await db("users");
      expect(users).toHaveLength(initialCount); // Count shouldn't change
    });
  });

  describe("Testing the auth login endpoint", () => {
    it('missing password or username returns "username and password required"', async () => {
      const response = await request(server)
        .post("/api/auth/login")
        .send({ username: "manny" });

      expect(response.body).toEqual({
        message: "username and password required",
      });
      expect(response.status).toBe(400);
    });

    it("missing password or username returns appropriate status code", async () => {
      const response = await request(server)
        .post("/api/auth/login")
        .send({ username: "manny" });

      expect(response.status).toBe(400);
    });

    it("Successful login sends appropriate status code and welcome message", async () => {
      // First register a test user
      await request(server)
        .post("/api/auth/register")
        .send({ username: "loginTest", password: "mypassword" });

      // Now try to login
      const loginResponse = await request(server)
        .post("/api/auth/login")
        .send({ username: "loginTest", password: "mypassword" });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.message).toBe("welcome, loginTest");
      expect(loginResponse.body.token).toBeTruthy(); // Check that token exists
    });

    it("Sends invalid credentials if password is incorrect", async () => {
      // First register a test user if not exists already
      await request(server)
        .post("/api/auth/register")
        .send({ username: "wrongPassTest", password: "correctpass" });

      // Now try with wrong password
      const badLoginResponse = await request(server)
        .post("/api/auth/login")
        .send({ username: "wrongPassTest", password: "wrongpass" });

      expect(badLoginResponse.body).toEqual({ message: "invalid credentials" });
      expect(badLoginResponse.status).toBe(401); // Should be 401 Unauthorized
    });
  });
});
