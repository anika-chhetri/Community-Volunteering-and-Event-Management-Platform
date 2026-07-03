import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EventCard from "./events/EventCard";
import Chatbot from "./Chatbot";
import "./Home.css";

export default function Home() {
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch((process.env.REACT_APP_API || "http://localhost:4000") + "/api/dashboard/events")
      .then((res) => res.json())
      .then(setEvents)
      .catch(console.error);
  }, []);

  return (
    <div className="home-page">

      {/* HERO BANNER */}
      <section
  className="hero"
  style={{
    width: "100vw",
    marginLeft: "calc(50% - 50vw)", // removes container side padding
    backgroundImage:
      "url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    height: "60vh", // cinematic landscape height
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    textShadow: "0 0 10px black",
    fontSize: "48px",
    fontWeight: "bold",
    borderRadius: "0" // remove round edges
  }}

      >
        Making Communities Stronger Together
      </section>

      {/* ABOUT US */}
      <section className="section">
        <h2>About Us</h2>
        <p>
         HelpingHands is a dedicated non-profit organization working across multiple sectors to uplift underprivileged communities in India.</p>
          <p> Its initiatives span education, healthcare, women empowerment, and community support programs, all designed to create sustainable and meaningful impact. The organization collaborates with passionate volunteers from different parts of the country, enabling them to contribute their time and skills through teaching, awareness drives, medical camps, skill-development workshops, and various outreach activities. </p>
         <p>Together, HelpingHands and its volunteer network strive to build stronger, healthier, and more empowered communities, ensuring that essential opportunities and resources reach those who need them most.</p>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="section">
        <h2>Upcoming Events</h2>

        <div className="cards">
          {events.slice(0, 3).map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              onClick={() => navigate(`/events/${ev.id}`)}
            />
          ))}
        </div>

        <button
          onClick={() => navigate("/events")}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            background: "#0077cc",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          View More Events →
        </button>
      </section>

      {/* CONTACT */}
      <section className="section" id="contact">
        <h2>Contact Us</h2>
        <p><strong>Phone:</strong> +91 98765 43210</p>
        <p><strong>Email:</strong> support@ngoportal.org</p>
      </section>

      <Chatbot />
    </div>
  );
}
