import React, { useEffect, useState } from "react";
import { fetchAnalytics } from "../services/analyticsService";
import RatingAnalytics from "../components/RatingAnalytics";


const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  

  useEffect(() => {
    fetchAnalytics().then((data) => setAnalytics(data));
  }, []);

  
  return (
    <div>
      <h2>Platform Analytics</h2>
      {analytics ? (
        <>
          <p>Total Events: {analytics.totalEvents}</p>
          <p>Total Users: {analytics.totalUsers}</p>
          <RatingAnalytics ratings={analytics.ratings} />
        </>
      ) : (
        <p>Loading analytics...</p>
      )}
    </div>
  );
};

export default Analytics;
