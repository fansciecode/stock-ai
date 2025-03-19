import request from "supertest";
import app from "../server.js";

describe("Notification API", () => {
    it("should fail if user is not authenticated", async () => {
        const res = await request(app).get("/api/notifications/");
        expect(res.status).toBe(401);
    });

    it("should return notifications for authenticated user", async () => {
        const token = "valid-token"; // Mock a valid token
        const res = await request(app)
            .get("/api/notifications/")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
