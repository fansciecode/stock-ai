import request from "supertest";
import app from "../server.js";

describe("User API", () => {
    it("should register a new user", async () => {
        const res = await request(app).post("/api/users/register").send({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
        });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("message", "User registered successfully");
    });

    it("should fail login with incorrect credentials", async () => {
        const res = await request(app).post("/api/users/login").send({
            email: "john@example.com",
            password: "wrongpassword",
        });

        expect(res.status).toBe(401);
    });

    it("should login successfully with correct credentials", async () => {
        const res = await request(app).post("/api/users/login").send({
            email: "john@example.com",
            password: "password123",
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
    });
});
