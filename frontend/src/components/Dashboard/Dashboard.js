import React, { useState, useEffect } from 'react';
import VolunteerDonorSection from './VolunteerDonorSection';
import NgoDashboard from './NgoDashboard';
import AdminDashboard from './AdminDashboard';
import './dashboard.css';

export default function Dashboard({ user, token }) {
  const [me, setMe] = useState(user);
  const [events, setEvents] = useState([]);
  const [msg, setMsg] = useState('');
  const [reports, setReports] = useState(null);
  const [activities, setActivities] = useState(null);
  const [ngoPanel, setNgoPanel] = useState(null);
  const [ngoList, setNgoList] = useState([]);

  useEffect(() => {
    if (!token) return;

    fetch((process.env.REACT_APP_API || 'http://localhost:4000') + '/api/dashboard/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => d.user && setMe(d.user));

    fetch((process.env.REACT_APP_API || 'http://localhost:4000') + '/api/dashboard/events')
      .then(r => r.json())
      .then(setEvents);
  }, [token]);

  useEffect(() => {
    if (token && me?.role === 'Volunteer/Donor') {
      fetch((process.env.REACT_APP_API || 'http://localhost:4000') + '/api/dashboard/my-activities', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(setActivities);
    }
  }, [token, me]);

  useEffect(() => {
    if (token && me?.role === 'NGO') {
      fetch((process.env.REACT_APP_API || 'http://localhost:4000') + '/api/ngo/panel', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(setNgoPanel);
    }
  }, [token, me]);

  useEffect(() => {
    if (token && me?.role === 'Admin') {
      fetch((process.env.REACT_APP_API || 'http://localhost:4000') + '/api/actions/reports', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(setReports);

      // NGO list endpoint not implemented in backend for demo; keep empty or reuse events as placeholder
      setNgoList([]);
    }
  }, [token, me]);

  if (!me) return <div>Please login to see your dashboard.</div>;

  return (
    <div className="dashboard-bg">
      <div className="dashboard-inner">
        <div className="dashboard">
          <h2>{me.role} Dashboard</h2>

      {/* VOLUNTEER */}
      {me.role === 'Volunteer/Donor' && (
        <VolunteerDonorSection
          me={me}
          events={events}
          token={token}
          msg={msg}
          setMsg={setMsg}
          activities={activities}
        />
      )}

      {/* NGO */}
      {me.role === 'NGO' && (
        <NgoDashboard
          token={token}
          msg={msg}
          setMsg={setMsg}
          events={events}
          setEvents={setEvents}
          ngoPanel={ngoPanel}
        />
      )}

      {/* ADMIN */}
      {me.role === 'Admin' && (
        <AdminDashboard
          reports={reports}
          ngoList={ngoList}
          token={token}
          setMsg={setMsg}
        />
      )}

          <p className="msg">{msg}</p>
        </div>
      </div>
    </div>
  );
}
