import request from "supertest";
import app from "../server.js";

describe("Chat API", () => {
    it("should fail if user is not authenticated", async () => {
        const res = await request(app).get("/api/chat/");
        expect(res.status).toBe(401);
    });

    it("should send a message successfully when authenticated", async () => {
        const token = "valid-token"; // Mock a valid token
        const res = await request(app)
            .post("/api/chat/send")
            .set("Authorization", `Bearer ${token}`)
            .send({ roomId: "12345", message: "Hello, World!" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message", "Message sent successfully");
    });
});
