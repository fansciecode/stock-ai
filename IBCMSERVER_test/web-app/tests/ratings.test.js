import { submitRating, fetchEventRatings } from "../services/ratingService";

test("submitRating should post a new rating", async () => {
  const ratingData = { eventId: "123", rating: 5, comment: "Great event!" };
  const response = await submitRating(ratingData);
  expect(response).toHaveProperty("message", "Rating submitted successfully");
});

test("fetchEventRatings should return ratings for an event", async () => {
  const eventId = "123";
  const data = await fetchEventRatings(eventId);
  expect(Array.isArray(data)).toBe(true);
});
