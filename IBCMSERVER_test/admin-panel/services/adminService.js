import React, { useEffect, useState } from "react";
import {
  fetchAdminAnalytics,
  fetchRatingAnalytics,
  fetchSubscriptionStats,
} from "../services/adminService";
import RatingAnalytics from "../components/RatingAnalytics";

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [ratingData, setRatingData] = useState(null);
  const [subscriptionStats, setSubscriptionStats] = useState(null);

  useEffect(() => {
    fetchAdminAnalytics().then((data) => setAnalytics(data));
    fetchRatingAnalytics().then((data) => setRatingData(data));
    fetchSubscriptionStats().then((data) => setSubscriptionStats(data));
  }, []);

  return (
    <div>
      <h2>Platform Analytics</h2>
      {analytics ? (
        <>
          <p>Total Events: {analytics.totalEvents}</p>
          <p>Total Users: {analytics.totalUsers}</p>
        </>
      ) : (
        <p>Loading analytics...</p>
      )}

      {ratingData ? (
        <RatingAnalytics ratings={ratingData} />
      ) : (
        <p>Loading rating analytics...</p>
      )}

      {subscriptionStats ? (
        <div>
          <h3>Subscription Statistics</h3>
          <p>Active Subscriptions: {subscriptionStats.activeSubscriptions}</p>
          <p>Revenue: ${subscriptionStats.totalRevenue}</p>
        </div>
      ) : (
        <p>Loading subscription statistics...</p>
      )}
    </div>
  );
};

export default Analytics;
