import React, { useEffect, useState } from 'react';
import EventCard from './events/EventCard';

const Events = () => {
  const [events, setEvents] = useState([]);

  useEffect(()=>{
    fetch((process.env.REACT_APP_API || 'http://localhost:4000') + '/api/dashboard/events')
      .then(r=>r.json()).then(setEvents).catch(()=>{
        // fallback sample
        setEvents([
          { id:1, title:'Sample Event', description:'This is a sample event', image_url:'https://via.placeholder.com/400x200' }
        ]);
      });
  },[]);

  return (
    <div className="events-container">
      <h2>Upcoming Events</h2>

      <div className="events-grid">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default Events;
