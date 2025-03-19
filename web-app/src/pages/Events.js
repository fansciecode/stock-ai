import React, { useState, useEffect } from "react";
import EventCard from "../components/EventCard";
import eventService from "../services/eventService";

const Events = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    eventService.getEvents().then(setEvents);
  }, []);

  return (
    <div>
      <h2>Events</h2>
      {events.map((event) => (
        <EventCard key={event.id} event={event} onRegister={() => {}} />
      ))}
    </div>
  );
};

export default Events;
