import api from "./api";

// Fetch available subscription plans
export const getSubscriptionPlans = async () => {
  const response = await api.get("/admin/subscriptions");
  return response.data;
};

// Update subscription plan dynamically
export const updateSubscriptionPlan = async (planId, data) => {
  const response = await api.put(`/admin/subscriptions/${planId}`, data);
  return response.data;
};

// Delete a subscription plan
export const deleteSubscriptionPlan = async (planId) => {
  await api.delete(`/admin/subscriptions/${planId}`);
};
