import api from "./api";

export const submitRating = async (ratingData) => {
  try {
    const response = await api.post("/ratings", ratingData);
    return response.data;
  } catch (error) {
    console.error("Error submitting rating:", error);
    return null;
  }
};

export const fetchEventRatings = async (eventId) => {
  try {
    const response = await api.get(`/ratings/event/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return [];
  }
};
