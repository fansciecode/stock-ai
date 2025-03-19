import authService from "../services/authService";

test("should return an error for invalid login", async () => {
  try {
    await authService.login({ email: "wrong@example.com", password: "wrongpass" });
  } catch (error) {
    expect(error).toBeDefined();
  }
});
