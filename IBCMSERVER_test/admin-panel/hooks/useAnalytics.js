import { useState, useEffect } from "react";
import { fetchAnalytics } from "../services/analyticsService";

const useAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics().then((data) => setAnalytics(data));
  }, []);

  return analytics;
};

export default useAnalytics;
