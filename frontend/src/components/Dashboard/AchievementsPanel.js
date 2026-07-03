import React, { useEffect, useState } from 'react';

export default function AchievementsPanel({ token, me = {}, role = 'user', onViewNgo }) {
  const [achievements, setAchievements] = useState(null);
  const [badges, setBadges] = useState([]);

  // Load badges from backend
  const loadBadges = () => {
    if (!token) return;

    const apiBase = process.env.REACT_APP_API || "http://localhost:4000";

    fetch(`${apiBase}/api/actions/user-badges`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setBadges(d?.badges || []))
      .catch(() => setBadges([]));

    fetch(
      role === "NGO"
        ? `${apiBase}/api/ngo/achievements`
        : `${apiBase}/api/actions/achievements`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(r => r.json())
      .then(d => setAchievements(d))
      .catch(() => setAchievements({ badges: [] }));
  };

  // Load on token change
  useEffect(() => {
    loadBadges();
  }, [token, role]);

  // 🔥 Reload badges whenever points change
  useEffect(() => {
    loadBadges();
  }, [me.points]);

  const iconMap = {
    "Gold Volunteer":
      "https://up.yimg.com/ib/th/id/OIP.M2jWfXFIT6yiFKdza-Xy9QHaHa?pid=Api&rs=1",
    "Silver Volunteer":
      "https://up.yimg.com/ib/th/id/OIP.8jVsS3Paqnphh1RUaZRO_gHaHa?pid=Api&rs=1",
    "Bronze Volunteer":
      "https://up.yimg.com/ib/th/id/OIP.OHs_yaTRMl1wF9glVaPZmgHaHa?pid=Api&rs=1",

    "Platinum Donor":
      "https://tse3.mm.bing.net/th/id/OIP.Imd7GlakFy5b_od5xomrDAHaHa?pid=Api",
    "Gold Donor":
      "https://up.yimg.com/ib/th/id/OIP.M2jWfXFIT6yiFKdza-Xy9QHaHa?pid=Api&rs=1",
    "Silver Donor":
      "https://up.yimg.com/ib/th/id/OIP.8jVsS3Paqnphh1RUaZRO_gHaHa?pid=Api&rs=1",
    "Bronze Donor":
      "https://up.yimg.com/ib/th/id/OIP.OHs_yaTRMl1wF9glVaPZmgHaHa?pid=Api&rs=1",
  };
     

  return (
    <div style={{ width: 320 }}>
      <h3>Achievements</h3>

      {/* POINTS CARD */}
      <div
        style={{
          background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
          padding: 18,
          borderRadius: 12,
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 800 }}>{me?.points || 0}</div>
        <div>POINTS</div>
      </div>

      {/* BADGES SECTION */}
      <h4 style={{ marginTop: 18 }}>Badges</h4>

      {!achievements && <div>Loading badges...</div>}

      {badges.length === 0 && achievements && (
        <div style={{ background: "#fff", padding: 12, borderRadius: 10 }}>
          No badges yet — participate to earn rewards.
        </div>
      )}

      {badges.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 10,
            marginTop: 10,
          }}
        >
          {badges.map((b, i) => {
            const finalIcon =
              b.icon || iconMap[b.title] || iconMap[b.badge_key] || "";

            return (
              <div
                key={i}
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: 10,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
                  textAlign: "center",
                }}
              >
                {finalIcon && (
                  <img
                    src={finalIcon}
                    alt={b.title}
                    style={{ width: 45, height: 45, marginBottom: 6 }}
                  />
                )}

                <div style={{ fontWeight: 700 }}>{b.title}</div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {b.description}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
