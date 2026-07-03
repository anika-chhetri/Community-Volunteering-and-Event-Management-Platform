import React, { useState } from "react";

export default function Volunteer({ token, events, setMsg }) {
  const [eventId, setEventId] = useState("");

  function volunteerSubmit(e) {
    e.preventDefault();

    if (!eventId) {
      setMsg("Please select an event");
      return;
    }

    fetch((process.env.REACT_APP_API || "http://localhost:4000") + "/api/actions/volunteer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ event_id: eventId })
    })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) setMsg(d.message || d.msg || 'Error registering');
        else setMsg(d.message || d.msg || 'Registered');
      })
      .catch(()=> setMsg('Network error'));
  }

  return (
    <form onSubmit={volunteerSubmit}>
      <select value={eventId} onChange={e => setEventId(e.target.value)}>
        <option value="">-- Select Event --</option>
        {events.map(ev => (
          <option value={ev.id} key={ev.id}>
            {ev.title} {ev.ngo_name ? `— (${ev.ngo_name})` : ''}
          </option>
        ))}
      </select>

      <button type="submit" style={{ backgroundColor: '#3094c6ff' }}>Volunteer</button>

    </form>
  );
}
