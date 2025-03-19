const API_URL = "/api/events";

export const getEvents = async () => {
  const response = await fetch(API_URL);
  return response.json();
};

export const createEvent = async (eventData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  return response.json();
};
