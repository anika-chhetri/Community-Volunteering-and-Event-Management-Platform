import React, { useState, useEffect, useMemo } from "react";
import UserProfileCard from "./UserProfileCard";
import Toast from "./Toast";

export default function NgoDashboard({ token, msg, setMsg, events, setEvents, ngoPanel }) {
  // ----------------------------------------
  // STATE DEFINITIONS
  // ----------------------------------------
  const [me, setMe] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    requiredVolunteers: 0,
    image_url: ""
  });
  const [volunteers, setVolunteers] = useState(null);
  const [myDonations, setMyDonations] = useState(null);
  const [totalRaised, setTotalRaised] = useState(0);
  const [achievements, setAchievements] = useState(null);
  const [participants, setParticipants] = useState(null); // Renamed from selectedParticipants for clarity
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [feedback, setFeedback] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [eventActivities, setEventActivities] = useState({}); // Map of eventId -> activities
  
  // NEW STATE: Controls which view is active (null, 'volunteers', 'donations', 'achievements', 'participants')
  const [activeView, setActiveView] = useState(null);

  // Filter events to only show those created by the current user (NGO)
  const myEvents = useMemo(() => {
    if (!me || !events || !Array.isArray(events)) return [];
    return events.filter(e => e.created_by === me.id || e.ngo_id === me.id);
  }, [events, me]); 

  // ----------------------------------------
  // FETCH LOGGED-IN USER /me (PROFILE)
  // ----------------------------------------
  useEffect(() => {
    if (!token) return;

    fetch((process.env.REACT_APP_API || "http://localhost:4000") + "/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setMe(d.user || d))
      .catch(() => {});
  }, [token]);

  // ----------------------------------------
  // FETCH ACHIEVEMENTS ON LOAD
  // ----------------------------------------
  useEffect(() => {
    // This is retained but will only run on component mount/token change, not when the user clicks 'View Achievements'
    // The click handler will be used for setting the active view.
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(
          (process.env.REACT_APP_API || "http://localhost:4000") + "/api/ngo/achievements",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const d = await res.json();
        setAchievements(d);
      } catch (e) {}
    })();
  }, [token]);

  // ----------------------------------------
  // CRUD FUNCTIONS
  // ----------------------------------------
  function createEvent(e) {
    e.preventDefault();

    fetch((process.env.REACT_APP_API || "http://localhost:4000") + "/api/ngo/create-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(newEvent)
    })
      .then(r => r.json())
      .then(d => {
        if (d.event) {
          setToast({ message: '✓ Event created successfully!', type: 'success' });
          setEvents([...events, d.event]);
          setNewEvent({ title: "", description: "", location: "", date: "", requiredVolunteers: 0, image_url: "" });
        } else {
          setToast({ message: '✕ ' + (d.msg || 'Failed to create event'), type: 'error' });
        }
      })
      .catch(err => setToast({ message: '✕ Error creating event', type: 'error' }));
  }

  async function deleteEvent(eventId) {
    if (!window.confirm('Are you sure you want to delete this event? This will also delete all volunteers, donations, and feedback associated with it.')) return;

    try {
      const API = process.env.REACT_APP_API || "http://localhost:4000";
      console.log('Attempting to delete event:', eventId);
      console.log('Token:', token ? 'present' : 'missing');
      
      const res = await fetch(`${API}/api/ngo/delete-event/${eventId}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });

      console.log('Delete response status:', res.status);
      const data = await res.json();
      console.log('Delete response data:', data);

      if (res.ok) {
        setToast({ message: 'Event deleted successfully! All related data (volunteers, donations, feedback) has been removed.', type: 'success' });
        // Remove from events array - works with the filtered myEvents
        setEvents(events.filter(e => e.id !== eventId));
      } else {
        setToast({ message: data.message || 'Failed to delete event', type: 'error' });
      }
    } catch (err) {
      console.error('Delete event error:', err);
      setToast({ message: 'Error deleting event: ' + err.message, type: 'error' });
    }
  }

  async function fetchEventActivity(eventId) {
    if (!token) return;
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API || "http://localhost:4000"}/api/ngo/event-activity/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEventActivities(prev => ({
        ...prev,
        [eventId]: data.activities || []
      }));
    } catch (err) {
      console.error('Error fetching event activity:', err);
    }
  }

  // Load event activities for all myEvents when they change
  useEffect(() => {
    if (myEvents && myEvents.length && token) {
      myEvents.forEach(e => {
        if (!eventActivities[e.id]) {
          fetchEventActivity(e.id);
        }
      });
    }
  }, [myEvents, token]);

  // ----------------------------------------
  // DATA FETCH HANDLERS (UPDATED TO USE setActiveView)
  // ----------------------------------------

  async function fetchVolunteers() {
    if (!token) {
      setToast({ message: '✕ Please login first', type: 'error' });
      return;
    }
    setActiveView('volunteers'); // Set active view

    try {
      const res = await fetch(
        (process.env.REACT_APP_API || "http://localhost:4000") + "/api/ngo/volunteers",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await res.json();
      setVolunteers(d.volunteers || []);
    } catch (e) {
      setToast({ message: '✕ Error fetching volunteers', type: 'error' });
    }
  }

  async function fetchMyDonations() {
    if (!token) {
      setToast({ message: '✕ Please login first', type: 'error' });
      return;
    }
    setActiveView('donations'); // Set active view

    try {
      const res = await fetch(`${process.env.REACT_APP_API || "http://localhost:4000"}/api/ngo/my-donations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch donations');

      const data = await res.json();
      setMyDonations(data.donations || []);
      setTotalRaised(data.totalRaised || 0); // Total is calculated on the backend
    } catch (err) {
      setToast({ message: '✕ ' + err.message, type: 'error' });
    }
  }

  async function fetchAchievements() {
    if (!token) {
      setToast({ message: '✕ Please login first', type: 'error' });
      return;
    }
    setActiveView('achievements'); // Set active view
    
    // Note: Achievements are pre-fetched in a useEffect, but we fetch again 
    // or rely on the initial state if the backend is fast enough. 
    // We can use the already loaded achievements state to display.
    if (achievements) return; // Use existing state if available for faster view switch

    try {
        const res = await fetch(
          (process.env.REACT_APP_API || "http://localhost:4000") + "/api/ngo/achievements",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const d = await res.json();
        setAchievements(d);
    } catch (e) {
        setToast({ message: '✕ Error fetching achievements', type: 'error' });
    }
  }

  async function fetchParticipants() {
    if (!token) {
      setToast({ message: '✕ Please login first', type: 'error' });
      return;
    }
    setActiveView('participants'); // Set active view

    try {
      const res = await fetch(
        (process.env.REACT_APP_API || "http://localhost:4000") + "/api/ngo/event-participants",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await res.json();
      setParticipants(d.events || []); // Store events with participant breakdown
    } catch (e) {
      setToast({ message: '✕ Error fetching participants', type: 'error' });
    }
  }


  // ----------------------------------------
  // UTILITY FUNCTION
  // ----------------------------------------
  function getRecentEventDate() {
    if (!events || !events.length) return "No events yet";

    const sorted = [...events].sort((a, b) => {
      const da = new Date(a.date || a.createdAt || "");
      const db = new Date(b.date || b.createdAt || "");
      return db - da;
    });

    const ev = sorted[0];
    const raw = ev.date || ev.createdAt;

    const parsed = new Date(raw);
    if (isNaN(parsed.getTime())) return "No valid date";

    return parsed.toLocaleDateString();
  }

  // ----------------------------------------
  // FEEDBACK FUNCTION
  // ----------------------------------------
  async function submitFeedback(e) {
    e.preventDefault();
    if (!token) {
      setFeedbackMsg("Please login to submit feedback.");
      return;
    }
    if (feedback.trim() === "") {
      setFeedbackMsg("Please write some feedback before submitting.");
      return;
    }
    
    setFeedbackMsg("Submitting feedback...");

    try {
      const res = await fetch((process.env.REACT_APP_API || "http://localhost:4000") + "/api/actions/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: feedback })
      });

      const data = await res.json();
      
      if (res.ok) {
        setFeedbackMsg(data.message); 
        setFeedback(""); 
      } else {
        setFeedbackMsg(`Error: ${data.message || 'Failed to submit feedback.'}`);
      }
    } catch (error) {
      console.error("Feedback submission error:", error);
      setFeedbackMsg("An unexpected network error occurred.");
    }
  }
  // ----------------------------------------


  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    <div className="panel" style={{ display: 'flex', gap: 16 }}>

      {/* LEFT PANEL */}
      <div style={{ width: 320, flexShrink: 0 }}>

        {/* FIXED PROFILE CARD - Profile works by using 'me' state */}
        <UserProfileCard token={token} setMsg={setMsg} me={me} activities={me?.activities || []} showPoints={false} />

        {/* QUICK LINKS UNDER PROFILE */}
        <div
          style={{
            marginTop: 16,
            background: "#f8fbff",
            padding: 16,
            borderRadius: 12,
            border: "2px solid #2196F3",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
          }}
        >
          <h4 style={{ marginBottom: 12, color: "#0b65c2" }}>Event Info</h4>

          <p><strong>Total Events:</strong> {events?.length || 0}</p>

          <p>
            <strong>Last Event Date:</strong> {getRecentEventDate()}
          </p>
        </div>

        {/* FEEDBACK SECTION */}
        <div
          style={{
            marginTop: 16,
            background: "#fffde7", 
            padding: 16,
            borderRadius: 12,
            border: "2px solid #ffc107", 
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)"
          }}
        >
          <h4 style={{ marginBottom: 12, color: "#ff8f00" }}>Give Feedback</h4>
          <form onSubmit={submitFeedback}>
            <textarea
              placeholder="Tell us what you think..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              rows="4"
              style={{ width: '100%', padding: 8, marginBottom: 8, borderRadius: 4, border: '1px solid #ccc' }}
            ></textarea>
            <button type="submit" style={{ width: '100%', backgroundColor: '#ff9800', color: 'white' }}>Submit</button>
          </form>
          {feedbackMsg && <p style={{ marginTop: 8, fontSize: 14, color: feedbackMsg.includes('Error') ? '#f44336' : '#4CAF50' }}>{feedbackMsg}</p>}
        </div>
      </div>

      {/* MIDDLE PANEL: Main Content (Create Event, Data Views) */}
      
      <div style={{ flex: 1 }}>

        <h4>Create New Event</h4>

        {/* Create Event Form */}
        <form onSubmit={createEvent}>
          <input
            type="text"
            placeholder="Event Title"
            value={newEvent.title}
            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
            required
          />

          <textarea
            placeholder="Event Description"
            value={newEvent.description}
            onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
          ></textarea>

          <input
            type="text"
            placeholder="Location"
            value={newEvent.location}
            onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
          />

          <input
            type="date"
            value={newEvent.date}
            onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
          />

          <input
            type="number"
            placeholder="Required Volunteers"
            value={newEvent.requiredVolunteers}
            onChange={e => setNewEvent({ ...newEvent, requiredVolunteers: e.target.value })}
          />

          <input
            type="url"
            placeholder="Event Image URL"
            value={newEvent.image_url}
            onChange={e => setNewEvent({ ...newEvent, image_url: e.target.value })}
          />

          <button type="submit">Create Event</button>
        </form>

        <p className="msg">{msg}</p>

        {/* YOUR EVENTS SECTION */}
        {myEvents && myEvents.length > 0 && (
          <div style={{ marginTop: 20, background: '#f0f9ff', padding: 12, borderRadius: 8 }}>
            <h4>📅 Your Events</h4>
            {myEvents.map(ev => (
              <div key={ev.id}>
                <div style={{
                  background: '#fff',
                  padding: 10,
                  marginBottom: 2,
                  borderRadius: 6,
                  border: '1px solid #e0e7ff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{ev.title}</strong>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      📍 {ev.location} | 📅 {ev.date}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEvent(ev.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Delete
                  </button>
                </div>
                {/* Activity Status - Green Prompts */}
                {eventActivities[ev.id] && eventActivities[ev.id].length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    gap: 6, 
                    marginBottom: 8,
                    flexWrap: 'wrap',
                    paddingLeft: 10
                  }}>
                    {eventActivities[ev.id].map((activity, idx) => (
                      <span key={idx} style={{
                        background: '#4CAF50',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        ✓ {activity.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* --- EXCLUSIVE CONTENT BUTTONS --- */}
        <div style={{ marginTop: 18, marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button 
            onClick={fetchVolunteers} 
            style={{ backgroundColor: activeView === 'volunteers' ? '#2196F3' : '', color: activeView === 'volunteers' ? 'white' : '' }}
          >
            View Volunteers
          </button>

          <button
            onClick={fetchMyDonations}
            style={{ backgroundColor: activeView === 'donations' ? '#2196F3' : '', color: activeView === 'donations' ? 'white' : '' }}
          >
            View My Donations
          </button>

          <button
            onClick={fetchAchievements}
            style={{ backgroundColor: activeView === 'achievements' ? '#2196F3' : '', color: activeView === 'achievements' ? 'white' : '' }}
          >
            View Achievements
          </button>

          <button
            onClick={fetchParticipants}
            style={{ backgroundColor: activeView === 'participants' ? '#2196F3' : '', color: activeView === 'participants' ? 'white' : '' }}
          >
            View Participants
          </button>
        </div>
        {/* --- END EXCLUSIVE CONTENT BUTTONS --- */}

        {/* --- EXCLUSIVE CONTENT DISPLAY --- */}

        {/* Volunteers View - Detailed List */}
        {activeView === 'volunteers' && volunteers && (
          <div style={{ marginTop: 12, background: '#f0fff4', padding: 16, borderRadius: 8 }}>
            <h4>🧑‍🤝‍🧑 Volunteers Who Registered</h4>
            {volunteers.length ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {volunteers.map(v => (
                  <div key={v.id} style={{
                    padding: 12,
                    background: '#fff',
                    border: '1px solid #d1fae5',
                    borderRadius: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#065f46', fontSize: 14 }}>
                        👤 {v.user_name}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        📧 {v.user_email}
                      </div>
                      <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
                        🎯 Event: <strong>{v.event_title || 'N/A'}</strong>
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>
                        📍 {v.event_location || 'N/A'} | 📅 {v.event_date ? new Date(v.event_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div style={{
                      background: '#dcfce7',
                      border: '1px solid #86efac',
                      padding: '8px 12px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#166534',
                      marginLeft: 12,
                      whiteSpace: 'nowrap',
                      textAlign: 'center'
                    }}>
                      ✓<br/>Registered
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#999' }}>No volunteers registered yet.</p>
            )}
          </div>
        )}

        {/* My Donations View (Uniform/Real Data) */}
        {activeView === 'donations' && myDonations && (
          <div style={{ marginTop: 12, background: '#fef9c3', padding: 12, borderRadius: 8 }}>
            <h4>💰 Donations Raised by Your NGO</h4>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: '#d97706', marginBottom: 12, borderBottom: '2px dashed #fcd34d', paddingBottom: 8 }}>
              Total Raised: <span style={{ color: '#b45309' }}>₹{totalRaised.toLocaleString('en-IN')}</span> {/* Format the total */}
            </div>
            {myDonations.length ? (
              <div>
                {myDonations.map(dn => (
                  <div key={dn.id} style={{ 
                    padding: 8, 
                    borderBottom: "1px solid #f3e8ff", 
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <strong>{dn.donor_name}</strong> (<span style={{ fontSize: 13, color: '#666' }}>{dn.donor_email}</span>)
                      {dn.event_title && <div style={{ fontSize: 12, color: '#666' }}>Event: {dn.event_title}</div>}
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#d97706' }}>₹{dn.amount.toLocaleString('en-IN')}</span> {/* Format amount */}
                  </div>
                ))}
              </div>
            ) : (
              <p>No donations received yet.</p>
            )}
          </div>
        )}

        {/* Achievements View */}
        {activeView === 'achievements' && achievements && (
          <div style={{ marginTop: 12, background: '#eff6ff', padding: 12, borderRadius: 8 }}>
            <h4>🌟 Achievements</h4>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div className="stat-card" style={{ padding: 15, background: '#fff', borderRadius: 8, borderLeft: '4px solid #3b82f6', minWidth: 120, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="stat-num" style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>{achievements.totals.totalEvents}</div>
                <div className="stat-label" style={{ fontSize: 12, color: '#6b7280' }}>Total Events</div>
              </div>
              <div className="stat-card" style={{ padding: 15, background: '#fff', borderRadius: 8, borderLeft: '4px solid #10b981', minWidth: 120, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="stat-num" style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>{achievements.totals.totalVolunteers}</div>
                <div className="stat-label" style={{ fontSize: 12, color: '#6b7280' }}>Volunteers</div>
              </div>
              <div className="stat-card" style={{ padding: 15, background: '#fff', borderRadius: 8, borderLeft: '4px solid #f97316', minWidth: 120, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="stat-num" style={{ fontSize: 24, fontWeight: 'bold', color: '#f97316' }}>₹{achievements.totals.totalDonations.toLocaleString('en-IN')}</div>
                <div className="stat-label" style={{ fontSize: 12, color: '#6b7280' }}>Donations</div>
              </div>
              <div className="stat-card" style={{ padding: 15, background: '#fff', borderRadius: 8, borderLeft: '4px solid #8b5cf6', minWidth: 120, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="stat-num" style={{ fontSize: 24, fontWeight: 'bold', color: '#8b5cf6' }}>{achievements.successfulEvents}</div>
                <div className="stat-label" style={{ fontSize: 12, color: '#6b7280' }}>Successful Events</div>
              </div>
            </div>

            <div>
              <h5>Top Events</h5>
              {achievements.topEvents && achievements.topEvents.length ? (
                achievements.topEvents.map(ev => (
                  <div
                    key={ev.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 8,
                      borderBottom: "1px solid #e0e7ff",
                      background: '#fff',
                      marginBottom: 4,
                      borderRadius: 4
                    }}
                  >
                    <img
                      src={ev.image_url || "https://via.placeholder.com/100x60/3b82f6/ffffff?text=Event"}
                      alt="event visual"
                      style={{ width: 100, height: 60, objectFit: "cover", borderRadius: 6 }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{ev.title}</div>
                      <div style={{ fontSize: 13, color: "#666" }}>
                        Volunteers: {ev.volunteers_count}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No top events yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Participants View - Event Participation Breakdown */}
        {activeView === 'participants' && participants && (
          <div style={{ marginTop: 12, background: '#f5f3ff', padding: 16, borderRadius: 8 }}>
            <h4>👥 Event Participation Breakdown</h4>
            {participants.length ? (
              participants.map(event => (
                <div key={event.id} style={{
                  padding: 14,
                  borderBottom: "1px solid #ede9fe",
                  background: '#fff',
                  marginBottom: 12,
                  borderRadius: 6,
                  border: '1px solid #f3e8ff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start'
                }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 15, color: '#6d28d9' }}>{event.title}</strong>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                      📍 {event.location || 'N/A'} | 📅 {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                      <strong>Volunteers registered:</strong>
                    </div>
                    {event.volunteer_list ? (
                      <div style={{ fontSize: 11, color: '#555', marginTop: 4, paddingLeft: 8, borderLeft: '2px solid #c4b5fd' }}>
                        {event.volunteer_list.split('; ').map((v, idx) => (
                          <div key={idx} style={{ marginBottom: 2 }}>✓ {v}</div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: '#999', marginTop: 4, fontStyle: 'italic' }}>No volunteers yet</div>
                    )}
                  </div>
                  <div style={{
                    background: event.volunteer_count >= event.requiredVolunteers ? '#d1fae5' : '#fef3c7',
                    border: `2px solid ${event.volunteer_count >= event.requiredVolunteers ? '#6ee7b7' : '#fcd34d'}`,
                    borderRadius: 8,
                    padding: '12px 16px',
                    textAlign: 'center',
                    minWidth: 90,
                    marginLeft: 12
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: event.volunteer_count >= event.requiredVolunteers ? '#059669' : '#b45309' }}>
                      {event.volunteer_count}
                    </div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      of {event.requiredVolunteers}
                    </div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                      {event.volunteer_count >= event.requiredVolunteers ? '✓ Filled' : 'Needed'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 14, color: '#999' }}>No events created yet.</p>
            )}
          </div>
        )}

        {/* --- END EXCLUSIVE CONTENT DISPLAY --- */}

      </div>
    </div>
    </>
  );
}