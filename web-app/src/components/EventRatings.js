import React, { useState } from "react";

const EventRatings = ({ eventId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating > 0) {
      onSubmit({ eventId, rating, comment });
      setRating(0);
      setComment("");
    }
  };

  return (
    <div>
      <h3>Rate this Event</h3>
      <form onSubmit={handleSubmit}>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          <option value="0">Select Rating</option>
          <option value="1">⭐</option>
          <option value="2">⭐⭐</option>
          <option value="3">⭐⭐⭐</option>
          <option value="4">⭐⭐⭐⭐</option>
          <option value="5">⭐⭐⭐⭐⭐</option>
        </select>
        <input
          type="text"
          placeholder="Leave a comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default EventRatings;
