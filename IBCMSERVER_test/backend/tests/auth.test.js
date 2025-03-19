import request from "supertest";
import app from "../server.js";

describe("Auth API", () => {
    it("should return error for missing credentials", async () => {
        const res = await request(app).post("/api/users/login").send({});
        expect(res.status).toBe(400);
    });
});
