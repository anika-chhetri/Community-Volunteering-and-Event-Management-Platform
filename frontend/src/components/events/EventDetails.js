import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function EventDetails({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [volunteering, setVolunteering] = useState(false);
  const [hasVolunteered, setHasVolunteered] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const API = process.env.REACT_APP_API || "http://localhost:4000";
    
    // Fetch event details
    fetch(`${API}/api/dashboard/events/${id}`)
      .then(r => r.json())
      .then(eventData => {
        setEvent(eventData);
        
        // Fetch NGO info if event has ngo_id
        if (eventData.ngo_id) {
          fetch(`${API}/api/ngo/info/${eventData.ngo_id}`)
            .then(r => r.json())
            .then(setNgo)
            .catch(err => console.error("Error fetching NGO:", err));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleVolunteer = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setVolunteering(true);
    const API = process.env.REACT_APP_API || "http://localhost:4000";

    try {
      const res = await fetch(`${API}/api/ngo/volunteer-for-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: id })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✓ Successfully volunteered for this event!");
        setHasVolunteered(true);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(`✕ ${data.message || "Failed to volunteer"}`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("✕ Error: " + err.message);
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setVolunteering(false);
    }
  };

  if (loading) return <h2 style={{ textAlign: "center", padding: 30 }}>Loading...</h2>;
  if (!event) return <h2 style={{ textAlign: "center", padding: 30 }}>Event not found</h2>;

  return (
    <div style={{ padding: 30, maxWidth: 900, margin: "0 auto" }}>
      {message && (
        <div style={{
          padding: 12,
          marginBottom: 16,
          borderRadius: 8,
          background: message.includes("✓") ? "#d1fae5" : "#fee2e2",
          color: message.includes("✓") ? "#065f46" : "#991b1b",
          border: `1px solid ${message.includes("✓") ? "#a7f3d0" : "#fecaca"}`
        }}>
          {message}
        </div>
      )}

      <h1>{event.title}</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>{event.description}</p>

      <img
        src={event.image_url || event.image || "https://via.placeholder.com/800x400?text=Event"}
        alt="Event"
        style={{
          width: "100%",
          borderRadius: 10,
          marginTop: 16,
          marginBottom: 24,
          maxHeight: 400,
          objectFit: "cover",
        }}
      />

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: 20,
        marginBottom: 30,
        padding: 20,
        background: "#f9fafb",
        borderRadius: 10
      }}>
        {event.location && (
          <div>
            <h4 style={{ margin: "0 0 8px 0" }}>📍 Location</h4>
            <p style={{ margin: 0, color: "#666" }}>{event.location}</p>
          </div>
        )}
        {event.date && (
          <div>
            <h4 style={{ margin: "0 0 8px 0" }}>📅 Date</h4>
            <p style={{ margin: 0, color: "#666" }}>{new Date(event.date).toLocaleDateString()}</p>
          </div>
        )}
        {event.requiredVolunteers && (
          <div>
            <h4 style={{ margin: "0 0 8px 0" }}>👥 Volunteers Needed</h4>
            <p style={{ margin: 0, color: "#666" }}>{event.requiredVolunteers}</p>
          </div>
        )}
      </div>

      {ngo && (
        <div style={{
          padding: 16,
          background: "#dbeafe",
          borderRadius: 10,
          marginBottom: 24,
          border: "1px solid #93c5fd"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#1e40af" }}>🏢 Hosted By</h4>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>{ngo.name}</p>
              <p style={{ margin: 0, color: "#666", fontSize: 14 }}>{ngo.email}</p>
            </div>
            <button
              onClick={() => navigate(`/ngo/${ngo.id}`)}
              style={{
                padding: "8px 16px",
                background: "#1e40af",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14
              }}
            >
              View NGO
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {!token ? (
          <>
            <Link to="/login" style={{ textDecoration: "none" }}>
              <button style={{
                padding: "12px 24px",
                background: "#0077cc",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600
              }}>
                Login to Participate
              </button>
            </Link>
            <Link to="/register" style={{ textDecoration: "none" }}>
              <button style={{
                padding: "12px 24px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600
              }}>
                Register Now
              </button>
            </Link>
          </>
        ) : !hasVolunteered ? (
          <button
            onClick={handleVolunteer}
            disabled={volunteering}
            style={{
              padding: "12px 24px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: volunteering ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 600,
              opacity: volunteering ? 0.7 : 1
            }}
          >
            {volunteering ? "Volunteering..." : "🤝 Volunteer for This Event"}
          </button>
        ) : (
          <button
            disabled
            style={{
              padding: "12px 24px",
              background: "#d1d5db",
              color: "#6b7280",
              border: "none",
              borderRadius: 6,
              cursor: "not-allowed",
              fontSize: 16,
              fontWeight: 600
            }}
          >
            ✓ Already Volunteered
          </button>
        )}
      </div>
    </div>
  );
}
