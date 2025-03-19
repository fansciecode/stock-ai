import { fetchAnalytics } from "../services/analyticsService";

test("fetchAnalytics should return valid analytics data", async () => {
  const data = await fetchAnalytics();
  expect(data).toHaveProperty("totalEvents");
  expect(data).toHaveProperty("totalUsers");
  expect(Array.isArray(data.ratings)).toBe(true);
});
