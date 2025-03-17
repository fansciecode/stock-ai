import { useState, useEffect } from "react";
import { fetchEventRatings } from "../services/ratingService";

const useRatings = (eventId) => {
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    fetchEventRatings(eventId).then((data) => setRatings(data));
  }, [eventId]);

  return ratings;
};

export default useRatings;
