import React, { useEffect, useState } from "react";
import { fetchEventRatings } from "../services/ratingService";

const EventAnalytics = ({ eventId }) => {
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    fetchEventRatings(eventId).then((data) => setRatings(data));
  }, [eventId]);

  return (
    <div>
      <h3>Event Ratings</h3>
      {ratings.length === 0 ? (
        <p>No ratings yet</p>
      ) : (
        <ul>
          {ratings.map((rating, index) => (
            <li key={index}>
              {rating.user}: {rating.value} ⭐ - "{rating.comment}"
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EventAnalytics;
