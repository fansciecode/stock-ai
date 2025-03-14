import api from "./api";

// Fetch analytics data
export const fetchAnalytics = async () => {
  const response = await api.get("/admin/analytics");
  return response.data;
};

// Fetch event priority details
export const fetchEventPriorityData = async () => {
  const response = await api.get("/admin/event-priority");
  return response.data;
};
