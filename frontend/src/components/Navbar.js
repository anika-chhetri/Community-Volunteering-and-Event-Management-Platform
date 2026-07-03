import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onLogout, user }) {
  const navigate = useNavigate();

  const goToSection = (sectionId) => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  return (
    <nav className="nav">
      <div className="brand" onClick={() => goToSection('home-section')}>
        NGO Portal
      </div>

      <div className="links">
        <button onClick={() => goToSection('home-section')}>Home</button>
        <button onClick={() => { navigate('/about'); }}>About Us</button>
        <button onClick={() => { navigate('/events'); }}>Events</button>
        <button onClick={() => navigate('/#contact')}>Contact</button>
        <button onClick={() => navigate('/badges')}>Badges</button>

        {!user && <button onClick={() => navigate('/login')}>Login</button>}
        {!user && <button onClick={() => navigate('/register')}>Register</button>}
        {user && <button onClick={() => navigate('/dashboard')}>Dashboard</button>}
        {user && <button onClick={onLogout}>Logout</button>}
      </div>
    </nav>
  );
}
