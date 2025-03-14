import React from "react";

const EventCard = ({ event, onRegister }) => {
  return (
    <div className="event-card">
      <h3>{event.name}</h3>
      <p>{event.description}</p>
      <button onClick={() => onRegister(event.id)}>Register</button>
    </div>
  );
};

export default EventCard;
