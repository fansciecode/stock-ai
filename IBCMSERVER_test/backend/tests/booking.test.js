import request from "supertest";
import app from "../server.js";

describe("Booking API", () => {
    it("should fail to book an event without authentication", async () => {
        const res = await request(app).post("/api/bookings/").send({
            eventId: "12345",
        });

        expect(res.status).toBe(401);
    });

    it("should book an event successfully when authenticated", async () => {
        const token = "valid-token"; // Mock a valid token
        const res = await request(app)
            .post("/api/bookings/")
            .set("Authorization", `Bearer ${token}`)
            .send({
                eventId: "12345",
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("message", "Booking confirmed");
    });
});
