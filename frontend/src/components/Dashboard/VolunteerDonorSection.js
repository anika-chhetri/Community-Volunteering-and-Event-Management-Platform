import React, { useEffect, useState } from 'react';
import Feedback from './Feedback';
import Donate from './Donate';
import Volunteer from './Volunteer';
import UserProfileCard from './UserProfileCard';
import AchievementsPanel from './AchievementsPanel';


// --- STYLES FOR CONSISTENCY (Updated Action Section Styles) ---
const styles = {
  panelContainer: {
    display: 'flex',
    gap: 24,
    padding: 24,
    alignItems: 'flex-start',
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
  },
  leftPanel: {
    width: 320,
    flexShrink: 0,
  },
  middlePanel: {
    flex: 1,
  },
  rightPanel: {
    width: 340,
    flexShrink: 0,
  },
  card: {
    background: '#ffffff',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #e0e0e0',
    marginBottom: 20,
  },
  ngoListItem: {
    padding: '12px 10px',
    borderBottom: '1px solid #f5f5f5',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'background-color 0.2s, transform 0.1s',
    borderRadius: 8,
    margin: '4px 0',
  },
  ngoListItemHover: {
    backgroundColor: '#f0f4ff',
    transform: 'translateY(-1px)',
  },
  buttonPrimary: {
    marginBottom: 16,
    padding: '10px 15px',
    background: '#0057D9',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    transition: '0.2s',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0, 87, 217, 0.4)',
  },
  levelBox: {
    background: '#e6f7ff',
    padding: '14px 16px',
    borderRadius: 10,
    border: '1px solid #b3e6ff',
    marginBottom: 20,
  },
  detailItem: {
    padding: '10px 0',
    borderBottom: '1px dotted #e0e0e0',
    fontSize: 14,
  },
  // NEW/UPDATED STYLE: Action Box
  actionBox: {
    padding: 15,
    borderRadius: 8,
    border: '1px solid',
    marginBottom: 15,
  },
  // Specific color schemes
  feedbackBox: {
    backgroundColor: '#fffbe6', // Light Yellow
    borderColor: '#ffe58f',
  },
  donateBox: {
    backgroundColor: '#f0fff4', // Light Green
    borderColor: '#b7eb8f',
  },
  volunteerBox: {
    backgroundColor: '#e6f7ff', // Light Blue
    borderColor: '#91d5ff',
  }
};

// Helper function to determine the user's level style
function getUserLevel(points) {
  if (points >= 200) return { name: "Gold", color: "#FFD700" };
  if (points >= 100) return { name: "Silver", color: "#C0C0C0" };
  if (points >= 50) return { name: "Bronze", color: "#CD7F32" };
  if (points >= 10) return { name: "Member", color: "#0057D9" };
  return { name: "New", color: "#6c757d" };
}

export default function VolunteerDonorSection({ me = {}, events = [], token, setMsg, activities }) {

  const [myNgos, setMyNgos] = useState([]);
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [ngoStats, setNgoStats] = useState(null);

  // --- User profile fetch (unchanged) ---
  const [profile, setProfile] = useState(null);
  const [userActivities, setUserActivities] = useState([]);

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(
          (process.env.REACT_APP_API || "http://localhost:4000") + "/api/auth/me",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setProfile(data);
        setUserActivities(data.activities || []);

      } catch (err) {
        console.error(err);
        setMsg("Failed to load profile");
      }
    })();
  }, [token]);

  // --- Load user's NGOs (unchanged logic) ---
  async function loadMyNgos() {
    if (!token) { setMsg('Please login'); return; }

    try {
      const res = await fetch(
        (process.env.REACT_APP_API || 'http://localhost:4000') + '/api/actions/my-ngos',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error('Failed to load your NGOs');

      const d = await res.json();

      const filtered = (d?.ngos || []).filter(n =>
        (n.role || n.user_role || "").toLowerCase().trim() !== "administrator"
      );

      setMyNgos(filtered);
      setMsg('Your hosted NGOs loaded successfully.');

    } catch (err) {
      console.error(err);
      setMsg(err.message || 'Error loading your NGOs');
    }
  }

  // --- Load details for selected NGO (unchanged logic) ---
  async function viewNgoDetails(id) {
    if (!token) { setMsg('Please login'); return; }

    try {
      const res = await fetch(
        (process.env.REACT_APP_API || 'http://localhost:4000') + '/api/actions/ngo/' + id,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error('Failed to load NGO details');

      const d = await res.json();

      setSelectedNgo({
        ngo: d?.ngo || {},
        events: d?.events || [],
        donations: d?.donations || [],
        // TEMPORARY: Assuming the donations and events are the user's participation records for this NGO
        participation: [
          ...(d?.events || []).map(e => ({
            id: `event-${e.id}`, type: 'Volunteer', event_title: e.title, participated_on: e.date // Placeholder date
          })),
          ...(d?.donations || []).map(d => ({
            id: `donation-${d.id}`, type: 'Donation', event_title: `Amount: ₹${d.amount}`, participated_on: d.date // Placeholder date
          }))
        ]
      });
    } catch (err) {
      console.error(err);
      setMsg(err.message || 'Error loading NGO details');
    }
  }

  const userLevel = getUserLevel(profile?.points);

  return (
    <div style={styles.panelContainer}>

      {/* LEFT PANEL: User Profile & Achievements */}
      <div style={styles.leftPanel}>
        <UserProfileCard 
          token={token} 
          setMsg={setMsg} 
          me={profile} 
          activities={userActivities}
          showPoints={false}
          showBadges={false}
          customStats={[
            { label: 'Total Donations', value: activities?.donations?.length || 0 },
            { label: 'Events Participated', value: activities?.volunteers?.length || 0 }
          ]}
        />
        <div style={{ marginTop: 24 }}>
          <AchievementsPanel token={token} me={me} setMsg={setMsg} />
        </div>
      </div>

      {/* MIDDLE PANEL: Recognition & Actions */}
      <div style={styles.middlePanel}>
        <h3 style={{ marginBottom: 12 }}>⭐ Recognition & Actions</h3>

        {/* User Level Display */}
        <div style={{ ...styles.levelBox, marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 16 }}>
            <span style={{ color: "#666", marginRight: 8 }}>Current Level:</span>
            <strong style={{ color: userLevel.color, fontSize: 18 }}>
              {userLevel.name} Donor/Volunteer
            </strong>
          </p>
        </div>

        {/* Action Cards Container - Now using distinct boxes for each action */}
        <div style={styles.card}>
          <h4 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: 10 }}>Quick Actions</h4>

          {/* 1. Feedback Box (Yellow) */}
          <div style={{...styles.actionBox, ...styles.feedbackBox}}>
            <h5 style={{ marginTop: 0, marginBottom: 8 }}>Give Feedback 💬</h5>
            <Feedback token={token} setMsg={setMsg} />
          </div>

          {/* 2. Donate Box (Green) */}
          <div style={{...styles.actionBox, ...styles.donateBox}}>
            <h5 style={{ marginTop: 0, marginBottom: 8 }}>Make a Donation 💸</h5>
            <Donate token={token} setMsg={setMsg} />
          </div>

          {/* 3. Volunteer Box (Blue) */}
          <div style={{...styles.actionBox, ...styles.volunteerBox}}>
            <h5 style={{ marginTop: 0, marginBottom: 8 }}>Volunteer for Event 🤝</h5>
            <Volunteer token={token} events={events} setMsg={setMsg} />
          </div>

        </div>
      </div>

      {/* RIGHT PANEL: User's NGOs and Details */}
      <div style={styles.rightPanel}>
        <h4>🏛️ Your Hosted NGOs</h4>

        {/* Load NGOs Button */}
        <button
          onClick={loadMyNgos}
          style={styles.buttonPrimary}
        >
          View Hosting NGOs
        </button>

        {/* NGO List */}
        {myNgos.length > 0 ? (
          <div style={styles.card}>
            {myNgos.map((ngo) => (
              <div
                key={ngo.id}
                onClick={() => viewNgoDetails(ngo.id)}
                style={styles.ngoListItem}
                onMouseEnter={e => Object.assign(e.currentTarget.style, styles.ngoListItemHover)}
                onMouseLeave={e => Object.assign(e.currentTarget.style, { backgroundColor: 'transparent', transform: 'none' })}
              >
                {ngo.name}
              </div>
            ))}
          </div>
        ) : (
          <div style={{...styles.card, padding: 15, marginBottom: 20}}>
            <em style={{color: '#888'}}>No NGOs loaded yet. Click “View Hosting NGOs” above.</em>
          </div>
        )}

        {/* NGO Details */}
        <h4>📊 NGO Details & Your History</h4>

        {selectedNgo ? (
          <div style={styles.card}>
            {/* NGO NAME & CONTACT */}
            <h5 style={{ marginTop: 0, borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 12 }}>
              {selectedNgo?.ngo?.name || "Unknown NGO"}
            </h5>
            <div style={{ fontSize: 14, color: "#444", marginBottom: 15 }}>
              📧 {selectedNgo?.ngo?.email || "No email available"}
            </div>

            {/* PARTICIPATION BLOCK */}
            <div style={{ marginTop: 10 }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>Your Participation History</strong>

              {selectedNgo?.participation?.length > 0 ? (
                selectedNgo.participation.map((p) => (
                  <div
                    key={p.id}
                    style={styles.detailItem}
                  >
                    <div>
                      <strong style={{ minWidth: 70, display: 'inline-block' }}>Type:</strong>
                      <span style={{ color: p.type === 'Donation' ? '#28a745' : '#17a2b8', fontWeight: 600 }}>
                         {p.type}
                      </span>
                    </div>
                    <div>
                      <strong style={{ minWidth: 70, display: 'inline-block' }}>Details:</strong> {p.event_title}
                    </div>
                    <div>
                      <strong style={{ minWidth: 70, display: 'inline-block' }}>Date:</strong>
                      {new Date(p.participated_on).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#888', padding: '10px 0' }}>No participation records found with this NGO.</div>
              )}
            </div>
          </div>
        ) : (
          <div style={{...styles.card, padding: 15}}>
            <em style={{color: '#888'}}>Select an NGO from the list above to view its details and your participation history.</em>
          </div>
        )}

      </div>
    </div>
  );
}