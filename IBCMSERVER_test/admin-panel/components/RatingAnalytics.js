import React from "react";

const RatingAnalytics = ({ ratings }) => {
  if (!ratings || ratings.length === 0) {
    return <p>No ratings available</p>;
  }

  const averageRating = (
    ratings.reduce((sum, rating) => sum + rating.value, 0) / ratings.length
  ).toFixed(1);

  return (
    <div>
      <h3>Average Rating: {averageRating} ⭐</h3>
      <ul>
        {ratings.map((rating, index) => (
          <li key={index}>
            {rating.user}: {rating.value} ⭐
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RatingAnalytics;
