import request from "supertest";
import app from "../server.js";

describe("Event API", () => {
    it("should return all public events", async () => {
        const res = await request(app).get("/api/events/");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should fail to create an event without authentication", async () => {
        const res = await request(app).post("/api/events/create").send({
            title: "Sample Event",
            date: "2025-06-01",
            location: "NYC",
        });

        expect(res.status).toBe(401);
    });

    it("should create an event when authenticated", async () => {
        const token = "valid-token"; // Mock a valid token
        const res = await request(app)
            .post("/api/events/create")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Sample Event",
                date: "2025-06-01",
                location: "NYC",
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("message", "Event created successfully");
    });
});
