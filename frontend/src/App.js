import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Home from "./components/Home";
import About from "./components/About";
import Events from "./components/Events";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard/Dashboard"; // FIXED PATH
import EventPage from "./components/events/EventPage";
import Chatbot from "./components/Chatbot";
import BadgesPage from "./components/BadgesPage";


export default function App() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetch(
        (process.env.REACT_APP_API || "http://localhost:4000") +
          "/api/dashboard/me",
        { headers: { Authorization: `Bearer ${token}` } }
      )
        .then((r) => r.json())
        .then((d) => {
          if (d.user) setUser(d.user);
          else setUser(null);
        })
        .catch(() => setUser(null));
    } else setUser(null);
  }, [token]);

  function onLogin(tkn, u) {
    localStorage.setItem("token", tkn);
    setToken(tkn);
    setUser(u);
    navigate("/dashboard");
  }

  function onLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate("/");
  }

  return (
    <>
      <Navbar onLogout={onLogout} user={user} />

      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventPage token={token} />} />
          <Route path="/login" element={<Login onLogin={onLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={<Dashboard user={user} token={token} />}
            
          />
          <Route path="/badges" element={<BadgesPage />} />
        </Routes>
      </div>

      <Chatbot />
    </>
  );
}
