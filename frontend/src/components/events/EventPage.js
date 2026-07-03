import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EventPage({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [msg, setMsg] = useState("");
  const [ngoDetails, setNgoDetails] = useState(null);
  const [showNgo, setShowNgo] = useState(false);

  // Load event
  useEffect(() => {
    fetch((process.env.REACT_APP_API || "http://localhost:4000") + "/api/dashboard/events/" + id)
      .then((r) => r.json())
      .then((d) => setEvent(d))
      .catch(() => setEvent(null));
  }, [id]);

  // Volunteer
  async function volunteer() {
    if (!token) return navigate("/login");

    try {
      const res = await fetch(
        (process.env.REACT_APP_API || "http://localhost:4000") + "/api/ngo/volunteer-for-event",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ eventId: id }),
        }
      );
      const data = await res.json();
      setMsg(data.message || "Successfully volunteered!");
    } catch {
      setMsg("Error volunteering");
    }
  }

  // Load NGO ONLY when button is clicked
  async function loadNgo() {
    if (!event) return;
    
    const ngoId = event.ngo_id || event.created_by;
    if (!ngoId) {
      setShowNgo(false);
      return;
    }

    try {
      const res = await fetch(
        (process.env.REACT_APP_API || "http://localhost:4000") + "/api/ngo/info/" + ngoId
      );
      const ngo = await res.json();

      // Also get events created by this NGO
      const eventsRes = await fetch(
        (process.env.REACT_APP_API || "http://localhost:4000") + "/api/dashboard/events"
      );
      const allEvents = await eventsRes.json();
      const ngoEvents = allEvents.filter(e => (e.ngo_id === ngoId || e.created_by === ngoId));

      setNgoDetails({
        ngo,
        events: ngoEvents
      });
      setShowNgo(true);
    } catch (err) {
      console.error("Error loading NGO:", err);
      setShowNgo(false);
    }
  }

  if (event === null)
    return <div className="event-page">Event not found or loading...</div>;

  return (
    <div className="event-page">
      <h2>{event.title}</h2>

      <img
        src={event.image_url || "https://via.placeholder.com/900x300"}
        alt={event.title}
        style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 8 }}
      />

      <p style={{ marginTop: 12 }}>{event.description}</p>

      <div style={{ marginTop: 12 }}>
        <button className="buttons primary" onClick={volunteer}>Volunteer / Participate</button>

        <button className="buttons" onClick={() => navigate("/register")} style={{ marginLeft: 8 }}>
          Register
        </button>

        {/* Show only if NGO exists */}
        {(event.ngo_id || event.created_by) && (
          <button className="buttons" style={{ marginLeft: 8 }} onClick={loadNgo}>
            View Hosting NGO
          </button>
        )}
      </div>

      {msg && <p style={{ marginTop: 12, color: "green" }}>{msg}</p>}

      {/* NGO section */}
      {showNgo && ngoDetails && (
        <div style={{ marginTop: 18, background: "#fff", padding: 12, borderRadius: 8 }}>
          <h4>Hosting NGO</h4>
          <div>
            <strong>{ngoDetails?.ngo?.name || "Unknown NGO"}</strong>
          </div>
          <div style={{ fontSize: 13, color: "#666" }}>
            {ngoDetails?.ngo?.email || "No email available"}
          </div>

          <div style={{ marginTop: 8 }}>
            <strong>Events</strong>
            {ngoDetails?.events?.length ? (
              ngoDetails.events.map((ev) => (
                <div key={ev.id} style={{ padding: 6 }}>{ev.title}</div>
              ))
            ) : (
              <div>No events.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
