import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EventCard({ event }) {
  const navigate = useNavigate();

  function openEvent(e){
    e && e.stopPropagation();
    navigate(`/events/${event.id}`);
  }

  const bg = event.image_url || event.image || 'https://via.placeholder.com/600x360?text=Event';

  return (
    <div className="card event-card" onClick={openEvent} style={{cursor:'pointer'}}>
      <div className="event-hero" style={{backgroundImage:`url(${bg})`}}>
        <div className="hero-overlay" />
        <h3 className="hero-title">{event.title}</h3>
      </div>

      <div className="card-body">
        {event.description && <p className="muted">{event.description.slice(0,120)}{event.description.length>120?'...':''}</p>}
        {event.ngo_name && <div style={{fontSize:13,color:'#666',marginTop:8}}>Hosted by: <strong>{event.ngo_name}</strong></div>}
        <div style={{marginTop:10}}>
          <button className="buttons primary" onClick={openEvent}>View Event</button>
        </div>
      </div>
    </div>
  );
}
