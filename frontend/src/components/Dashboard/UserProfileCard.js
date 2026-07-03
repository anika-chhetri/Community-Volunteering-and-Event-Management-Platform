import React, { useState, useEffect } from 'react';

export default function UserProfileCard({ token, setMsg, me = {}, showPoints = true, showBadges = true, customStats = null }) {
  const [userSummary, setUserSummary] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const API = process.env.REACT_APP_API || 'http://localhost:4000';
        const res = await fetch(`${API}/api/dashboard/user-summary`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch user summary');
        const data = await res.json();
        setUserSummary(data);

        // Fetch badges
        const badgeRes = await fetch(`${API}/api/actions/user-badges`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (badgeRes.ok) {
          const badgeData = await badgeRes.json();
          setBadges(badgeData.badges || []);
        }
      } catch (err) {
        console.error(err);
        setMsg?.(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, setMsg]);

  if (loading || !userSummary) {
    return (
      <div style={{
        background: '#fff',
        padding: 14,
        borderRadius: 10,
        boxShadow: '0 6px 20px rgba(2,6,23,0.04)',
        marginBottom: 14
      }}>
        <p style={{ textAlign: 'center', color: '#999' }}>Loading profile...</p>
      </div>
    );
  }

  const { user = {}, stats = {} } = userSummary;
  const role = user.role || 'Unknown';
  
  // Color code by role
  const roleColors = {
    'Admin': { bg: '#fee2e2', text: '#991b1b', icon: '🔐' },
    'NGO': { bg: '#dbeafe', text: '#1e40af', icon: '🏢' },
    'volunteer': { bg: '#dcfce7', text: '#15803d', icon: '🤝' },
    'donor': { bg: '#fef3c7', text: '#92400e', icon: '💝' }
  };

  const roleInfo = roleColors[role] || roleColors['volunteer'];

  return (
    <div style={{
      background: '#fff',
      padding: 14,
      borderRadius: 10,
      boxShadow: '0 6px 20px rgba(2,6,23,0.04)',
      marginBottom: 14
    }}>
      {/* Header: Icon + Name + Email + Role */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {/* User Icon */}
        <div style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: roleInfo.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 'bold',
          color: roleInfo.text,
          flexShrink: 0
        }}>
          {roleInfo.icon}
        </div>

        {/* Name + Email + Role Badge */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1f2937' }}>
            {user.name || 'Unknown'}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            {user.email || 'No email'}
          </div>
          <div style={{
            display: 'inline-block',
            background: roleInfo.bg,
            color: roleInfo.text,
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            marginTop: 4
          }}>
            {role}
          </div>
        </div>
      </div>

      {/* Points Card */}
      {showPoints && user.points !== undefined && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 12,
          borderRadius: 8,
          color: '#fff',
          marginBottom: 12,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>
            {user.points}
          </div>
          <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
            Total Points
          </div>
        </div>
      )}

      {/* Role-Specific Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: role === 'Admin' ? '1fr 1fr 1fr' : '1fr 1fr',
        gap: 8,
        marginBottom: 12
      }}>
        {role === 'Admin' && (
          <>
            <div style={{
              background: '#f3f4f6',
              padding: 10,
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                {stats.totalUsers || 0}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                Users
              </div>
            </div>
            <div style={{
              background: '#f3f4f6',
              padding: 10,
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                {stats.totalEvents || 0}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                Events
              </div>
            </div>
            <div style={{
              background: '#f3f4f6',
              padding: 10,
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                {stats.totalVolunteers || 0}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                Volunteers
              </div>
            </div>
          </>
        )}

        {role === 'NGO' && (
          <>
            <div style={{
              background: '#f3f4f6',
              padding: 10,
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                {stats.eventsHosted || 0}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                Events
              </div>
            </div>
            <div style={{
              background: '#f3f4f6',
              padding: 10,
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                ₹{stats.totalDonated || 0}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                Raised
              </div>
            </div>
          </>
        )}

        {(role === 'volunteer' || role === 'donor') && (
          <>
            <div style={{
              background: '#f3f4f6',
              padding: 10,
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                {stats.totalParticipation || 0}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                Participation
              </div>
            </div>
            <div style={{
              background: '#f3f4f6',
              padding: 10,
              borderRadius: 6,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>
                ₹{stats.totalDonated || 0}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                Donated
              </div>
            </div>
          </>
        )}
      </div>

      {/* Badges Section */}
      {showBadges && badges && badges.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#6b7280' }}>
            🏅 Earned Badges
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {badges.map((b, i) => (
              <div key={i} style={{
                display: 'inline-block',
                padding: '4px 8px',
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600
              }} title={b.description}>
                ⭐ {b.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Stats Section */}
      {customStats && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {customStats.map((stat, i) => (
              <div key={i} style={{
                background: '#f3f4f6',
                padding: 10,
                borderRadius: 6,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
