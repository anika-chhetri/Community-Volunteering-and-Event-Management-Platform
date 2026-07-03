import React, { useState } from "react";
import AchievementsPanel from "./AchievementsPanel";
import UserProfileCard from './UserProfileCard';

export default function AdminDashboard({ reports, token, setMsg, admin }) {
  const [ngos, setNgos] = useState(null);
  const [events, setEvents] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [eventStatsType, setEventStatsType] = useState(null);
  const [mostActive, setMostActive] = useState(null);
  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const [statsData, setStatsData] = useState({ totalEvents: 0, totalUsers: 0, totalVolunteers: 0 });
  const [users, setUsers] = useState(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [toast, setToast] = useState(null);

  const API = process.env.REACT_APP_API || "http://localhost:4000";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const updateStats = async () => {
    await loadStats();
  };

  const clearAll = () => {
    setNgos(null);
    setEvents(null);
    setEventStats(null);
    setMostActive(null);
  };

  const loadStats = async () => {
    try {
      // Load total events
      const eventsRes = await fetch(`${API}/api/actions/registered-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const eventsData = await eventsRes.json();
      const totalEvents = Array.isArray(eventsData.events) ? eventsData.events.length : 0;

      // Load total volunteers
      const volRes = await fetch(`${API}/api/actions/top-volunteers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const volData = await volRes.json();
      const totalVolunteers = Array.isArray(volData.top) ? volData.top.length : 0;

      // Load total users (NGOs)
      const ngosRes = await fetch(`${API}/api/actions/ngos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ngosData = await ngosRes.json();
      const totalUsers = Array.isArray(ngosData.ngos) ? ngosData.ngos.length : 0;

      setStatsData({ totalEvents, totalUsers, totalVolunteers });
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  // Load stats on mount
  React.useEffect(() => {
    if (token) loadStats();
  }, [token]);

  const loadData = async (endpoint, setter, expectedField = null, errMsg = "Failed to load") => {
    if (!token) return showToast("Login as admin first", "error");
    clearAll();
    try {
      const res = await fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).message || errMsg);
      const data = await res.json();
      if (expectedField && data[expectedField]) { setter(data[expectedField]); return; }
      const fallbackKeys = ["top", "mostActive", "most", "badges", "ngos", "events", "volunteers", "donors", "results", "participants", "donations", "user_badges", "users"];
      for (const key of fallbackKeys) if (data[key]) { setter(data[key]); return; }
      setter(Array.isArray(data) ? data : data);
    } catch (err) {
      showToast(err.message || errMsg, "error");
    }
  };

  const loadMostActive = async () => {
    if (!token) return showToast("Login as admin first", "error");
    clearAll();
    try {
      const res = await fetch(`${API}/api/actions/most-active-ngo`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load most active NGO");
      const data = await res.json();
      const candidate = data.mostActive || data.most || data.top || data.most_active || data[0] || null;
      setMostActive(Array.isArray(candidate) ? candidate[0] : candidate);
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const deleteNgo = async (id) => {
    if (!token) return showToast("Login as admin first", "error");
    if (!window.confirm("Are you sure you want to remove this NGO?")) return;

    try {
      const res = await fetch(`${API}/api/actions/remove-ngo/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error((await res.json()).message || "Failed to delete NGO");

      showToast("NGO removed successfully", "success");
      setNgos((prev) => (Array.isArray(prev) ? prev.filter((n) => n.id !== id) : prev));
      updateStats();
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  };

  const deleteUser = async (id) => {
    if (!token) return showToast("Login as admin first", "error");
    if (!window.confirm("Are you sure you want to delete this user? This will delete all related data.")) return;

    try {
      const res = await fetch(`${API}/api/actions/delete-user/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error((await res.json()).message || "Failed to delete user");

      showToast("User deleted successfully", "success");
      setUsers((prev) => (Array.isArray(prev) ? prev.filter((u) => u.id !== id) : prev));
      updateStats();
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  };

  const deleteEvent = async (id) => {
    if (!token) return showToast("Login as admin first", "error");
    if (!window.confirm("Are you sure you want to delete this event? This will delete all related data.")) return;

    try {
      const res = await fetch(`${API}/api/actions/delete-event/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error((await res.json()).message || "Failed to delete event");

      showToast("Event deleted successfully", "success");
      setEvents((prev) => (Array.isArray(prev) ? prev.filter((e) => e.id !== id) : prev));
      updateStats();
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  };

  const renderResults = (results, resultType = null) => {
    if (!results || !Array.isArray(results) || results.length === 0) return <p>No data found.</p>;

    const eventStatsView = resultType === 'eventStats' || (results[0]?.volunteers_count !== undefined);
    const badgesView = resultType === 'badges' || results[0]?.badge_name;
    const topView = (resultType === 'topVolunteers' || resultType === 'topDonors' || results[0]?.total) && !results[0]?.badge_name;

    if (eventStatsView) {
      const totalVol = results.reduce((sum, e) => sum + (e.volunteers_count || 0), 0);
      return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div style={{ padding: 16, background: '#e3f2fd', borderRadius: 8, border: '2px solid #2196f3', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1976d2' }}>📊</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#333', marginTop: 8 }}>{results.length}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Total Events</div>
            </div>
            <div style={{ padding: 16, background: '#f3e5f5', borderRadius: 8, border: '2px solid #9c27b0', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#7b1fa2' }}>🤝</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#333', marginTop: 8 }}>{totalVol}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Total Volunteers</div>
            </div>
          </div>
          <h5>Events Breakdown:</h5>
          {results.map((item, i) => (
            <div key={item.id || i} style={{ padding: 12, background: "#fff", borderRadius: 8, marginBottom: 8, border: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <strong style={{ fontSize: 14 }}>{item.title}</strong>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{item.location || 'No location'}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{item.date || 'No date'}</div>
              </div>
              <span style={{ padding: '6px 12px', background: '#9c27b0', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>👥 {item.volunteers_count || 0}</span>
            </div>
          ))}
        </div>
      );
    }

    if (badgesView) {
      return results.map((item, i) => (
        <div key={item.id || i} style={{ padding: 12, background: "#fff", borderRadius: 8, marginBottom: 8, border: '2px solid #ffd700', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <strong style={{ fontSize: 15, color: '#0057D9' }}>👤 {item.name}</strong>
            {item.email && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{item.email}</div>}
          </div>
          <span style={{ padding: '4px 10px', background: '#ffd700', color: '#333', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>🏆 {item.badge_name}</span>
        </div>
      ));
    }

    if (topView) {
      const sorted = [...results].sort((a, b) => (b.total || 0) - (a.total || 0));
      return sorted.map((item, i) => (
        <div key={item.id || i} style={{ padding: 12, background: i === 0 ? "#fff9c4" : "#fff", borderRadius: 8, marginBottom: 8, border: i === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <strong style={{ fontSize: 15, color: i === 0 ? '#ff6b6b' : '#0057D9' }}>{i === 0 ? '🌟 TOP: ' : ''}{item.name}</strong>
            {item.email && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{item.email}</div>}
          </div>
          <span style={{ padding: '6px 12px', background: i === 0 ? '#ff6b6b' : '#999', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>{resultType === 'topVolunteers' ? `${item.total} Events` : `₹${item.total}`}</span>
        </div>
      ));
    }

    return results.map((item, i) => {
      const name = item.name || item.user_name || item.donor_name || item.email;
      const title = item.title || item.event_title;
      return (
        <div key={item.id || i} style={{ padding: 10, background: "#fff", borderRadius: 8, marginBottom: 8, border: '1px solid #e0e0e0' }}>
          {title && <strong>{title}</strong>}
          {name && <strong>{name}</strong>}
          {item.email && <div style={{ fontSize: 12, color: "#666" }}>{item.email}</div>}
          {(item.date || item.created_at) && <div style={{ fontSize: 12, color: "#666" }}>{item.date || item.created_at}</div>}
        </div>
      );
    });
  };

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        
        {/* PROFILE HEADER WITH STATS */}
        <div
          style={{
            background: "#fff",
            padding: "16px",
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: "0 6px 20px rgba(2,6,23,0.05)",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto auto auto",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "#e3f2fd",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 28,
              fontWeight: 600,
              color: "#1976d2",
            }}
          >
            👤
          </div>

          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: "#333" }}>
              {admin?.email || "admin@ngo.local"}
            </div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>Role: Admin</div>
          </div>

          <div style={{ textAlign: "center", padding: "8px 16px", background: "#f5f5f5", borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1976d2" }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#333", marginTop: 4 }}>{statsData.totalEvents}</div>
            <div style={{ fontSize: 12, color: "#666" }}>Total Events</div>
          </div>

          <div style={{ textAlign: "center", padding: "8px 16px", background: "#f5f5f5", borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#388e3c" }}>👥</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#333", marginTop: 4 }}>{statsData.totalUsers}</div>
            <div style={{ fontSize: 12, color: "#666" }}>Total NGOs</div>
          </div>

          <div style={{ textAlign: "center", padding: "8px 16px", background: "#f5f5f5", borderRadius: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f57c00" }}>🤝</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#333", marginTop: 4 }}>{statsData.totalVolunteers}</div>
            <div style={{ fontSize: 12, color: "#666" }}>Total Volunteers</div>
          </div>
        </div>

        <AchievementsPanel
          token={token}
          me={{ points: reports?.adminPoints || 0 }}
          role="user"
          setMsg={setMsg}
        />

        <h3>Admin Reports</h3>

        <div className="cards">
          <div className="stat-card">
            <div className="stat-num">
              {reports?.donations
                ? reports.donations.reduce(
                    (sum, d) => sum + parseFloat(d.amount || 0),
                    0
                  )
                : "-"}
            </div>
            <div className="stat-label">Total Donation Amount (₹)</div>
          </div>

          <div className="stat-card">
            <div className="stat-num">{reports?.volunteers?.length || 0}</div>
            <div className="stat-label">Total Volunteers</div>
          </div>

          <div className="stat-card">
            <div className="stat-num">{reports?.feedbacks?.length || 0}</div>
            <div className="stat-label">Feedbacks</div>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => loadData("/api/actions/ngos", setNgos, "ngos", "Failed to load NGOs")}>View NGOs</button>
          <button onClick={() => loadData("/api/actions/registered-events", setEvents, "events", "Failed to load events")}>View Events</button>
          <button onClick={() => { setEventStatsType('eventStats'); loadData("/api/actions/event-stats", setEventStats, "events", "Failed to load event stats"); }}>Event Stats</button>
          <button onClick={() => { loadData("/api/actions/all-users", setUsers, "users", "Failed to load users"); setShowUsersModal(true); }}>View Users</button>
        </div>

        {events && (
          <div style={{ marginTop: 20 }}>
            <h4>Registered Events ({Array.isArray(events) ? events.length : 0})</h4>
            {Array.isArray(events) && events.length ? events.map((e) => (
              <div key={e.id} style={{ padding: 12, background: "#fff", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e0e0e0" }}>
                <div>
                  <strong>{e.title}</strong>
                  <div style={{ fontSize: 13, color: "#666" }}>{e.date || e.created_at}</div>
                  {e.location && <div style={{ fontSize: 12, color: "#999" }}>{e.location}</div>}
                </div>
                <button style={{ padding: "6px 12px", background: "#f44336", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }} onClick={() => deleteEvent(e.id)}>Delete</button>
              </div>
            )) : <p>No events registered.</p>}
          </div>
        )}

        {eventStats && (
          <div style={{ marginTop: 20 }}>
            <h4>Results</h4>
            {renderResults(eventStats, eventStatsType || 'badges')}
          </div>
        )}

        {ngos && (
          <div style={{ marginTop: 20 }}>
            <h4>Registered NGOs ({Array.isArray(ngos) ? ngos.length : 0})</h4>
            {Array.isArray(ngos) && ngos.length ? ngos.map((n) => (
              <div key={n.id} style={{ padding: 12, background: "#fff", borderRadius: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e0e0e0" }}>
                <div><strong>{n.name}</strong><div style={{ fontSize: 13, color: "#666" }}>{n.email}</div></div>
                <button style={{ padding: "6px 12px", background: "#f44336", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }} onClick={() => deleteNgo(n.id)}>Delete</button>
              </div>
            )) : <p>No NGOs registered.</p>}
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          position: "sticky",
          top: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >

        <div
          style={{
            background: "#fffbe6",
            padding: 12,
            borderRadius: 10,
            border: "2px solid #ffe58f",
            boxShadow: "0 6px 20px rgba(2,6,23,0.04)",
          }}
        >
          <h4>Quick Actions</h4>
          {[
            { label: 'Top Volunteers', type: 'topVolunteers', endpoint: '/api/actions/top-volunteers', field: 'top' },
            { label: 'Top Donors', type: 'topDonors', endpoint: '/api/actions/top-donors', field: 'top' },
            { label: 'View Badges', type: 'badges', endpoint: '/api/actions/badges', field: 'badges' }
          ].map((btn, i) => (
            <button key={i} onClick={() => { setEventStatsType(btn.type); loadData(btn.endpoint, setEventStats, btn.field, `Failed to load ${btn.label.toLowerCase()}`); }} style={{ width: "100%", padding: 10, borderRadius: 8, marginBottom: i < 2 ? 8 : 0 }}>
              {btn.label}
            </button>
          ))}
        </div>

        {/* Most Active NGO */}
        <div
          style={{
            background: "#e6f7ff",
            padding: 12,
            borderRadius: 10,
            border: "2px solid #91d5ff",
            boxShadow: "0 6px 20px rgba(8, 8, 9, 0.04)",
          }}
        >
          <h4>Most Active NGO</h4>

          <button
            onClick={loadMostActive}
            style={{ marginTop: 8, padding: 8, width: "100%", borderRadius: 6 }}
          >
            Load Most Active NGO
          </button>

          {mostActive && (
            <div style={{ marginTop: 12 }}>
              <strong>{mostActive.name}</strong>
              <div style={{ fontSize: 13, color: "#666" }}>
                Activity Score: {(mostActive?.activity_score ?? mostActive?.activityScore ?? mostActive?.activity) ?? "N/A"}
              </div>
            </div>
          )}
        </div>

        {/*  NEW FEEDBACK BOX WITH VIEW MORE  */}
<div
  style={{
    background: "#fffde7",
    padding: 12,
    borderRadius: 10,
    border: "2px solid #ffc107",
    boxShadow: "0 6px 20px rgba(2,6,23,0.04)",
    maxHeight: 250,
    overflowY: "auto",
  }}
>
  <h4>User Feedback</h4>

  {(() => {
    const fb = reports?.feedbacks || [];
    if (!fb.length) return <p>No feedback available.</p>;

    // sort by newest first just in case
    const sorted = [...fb].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const visibleFeedbacks = showAllFeedback ? sorted : [sorted[0]];

    return (
      <>
        {visibleFeedbacks.map((f, i) => (
          <div
            key={i}
            style={{
              background: "#f8f8f8ff",
              padding: 8,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <strong>{f.email || f.name || "User"}</strong>
            <div style={{ fontSize: 13, color: "#666" }}>
              {new Date(f.created_at).toLocaleString()}
            </div>
            <div style={{ marginTop: 4 }}>{f.text}</div>
          </div>
        ))}

        <button
          onClick={() => setShowAllFeedback((prev) => !prev)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 6,
            background: "#ff8f00",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          {showAllFeedback ? "View Less" : "View More"}
        </button>
      </>
    );
  })()}
</div>


      </div>

      {/* USERS MODAL */}
      {showUsersModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 24,
            maxWidth: 600,
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            position: "relative"
          }}>
            <button
              onClick={() => setShowUsersModal(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: 50,
                width: 32,
                height: 32,
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ✕
            </button>

            <h3 style={{ marginTop: 0 }}>All Users</h3>
            {Array.isArray(users) && users.length ? (
              users.map((u) => (
                <div
                  key={u.id}
                  style={{
                    padding: 12,
                    background: "#f9f9f9",
                    borderRadius: 8,
                    marginBottom: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid #e0e0e0"
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 14 }}>{u.name}</strong>
                    <div style={{ fontSize: 12, color: "#666" }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>Role: <span style={{ fontWeight: 600 }}>{u.role}</span></div>
                  </div>

                  {u.role !== 'Admin' && (
                    <button
                      style={{
                        padding: "6px 12px",
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap"
                      }}
                      onClick={() => deleteUser(u.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p>No users registered.</p>
            )}
          </div>
        </div>
      )}
       {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{
          position: "fixed",
          top: 20,
          right: 20,
          padding: "16px 24px", // Increased padding
          borderRadius: 8, // Slightly larger border radius
          background: toast.type === "success" ? "#4caf50" : "#f44336",
          color: "white",
          fontSize: 16, // Slightly larger font size
          fontWeight: 700, // Bolder font weight
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.4)", // Stronger shadow for pop
          zIndex: 10000,
          border: `3px solid ${toast.type === "success" ? "#81c784" : "#ff8a80"}`, // Lighter border color for contrast
          animation: "slideIn 0.4s ease-in-out",
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{toast.type === "success" ? "🎉" : "🚨"}</span>
            <div>
              <strong style={{ textTransform: 'uppercase' }}>{toast.type === "success" ? "Success!" : "Error!"}</strong>
              <p style={{ margin: 0, fontWeight: 500 }}>{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
