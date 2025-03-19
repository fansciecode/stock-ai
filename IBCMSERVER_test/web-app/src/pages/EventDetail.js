import React from "react";
import { useParams } from "react-router-dom";

const EventDetails = ({ events }) => {
  const { id } = useParams();
  const event = events.find((event) => event.id === id);

  if (!event) return <p>Event not found</p>;

  return (
    <div>
      <h2>{event.name}</h2>
      <p>{event.description}</p>
      <p>Date: {event.date}</p>
      <p>Location: {event.location}</p>
    </div>
  );
};

export default EventDetails;
