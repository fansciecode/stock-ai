import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEventsStart, fetchEventsSuccess, fetchEventsFail } from "../store/eventSlice.js";
import axios from "axios";

const Events = () => {
  const dispatch = useDispatch();
  const { events, loading } = useSelector((state) => state.events);

  useEffect(() => {
    const fetchEvents = async () => {
      dispatch(fetchEventsStart());
      try {
        const res = await axios.get("/api/admin/events");
        dispatch(fetchEventsSuccess(res.data));
      } catch (error) {
        dispatch(fetchEventsFail());
      }
    };

    fetchEvents();
  }, [dispatch]);

  return (
    <div>
      <h2>Events</h2>
      {loading ? <p>Loading...</p> : events.map((event) => <p key={event.id}>{event.name}</p>)}
    </div>
  );
};

export default Events;
