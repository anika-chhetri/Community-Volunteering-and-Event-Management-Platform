import React from "react";
import "./BadgesPage.css";
import { useNavigate } from "react-router-dom";

export default function BadgesPage() {
  const navigate = useNavigate();

  const badges = [
    {
      title: "Bronze Volunteer",
      desc: "Earned after 20 volunteer points",
      icon: "https://up.yimg.com/ib/th/id/OIP.OHs_yaTRMl1wF9glVaPZmgHaHa?pid=Api&rs=1&c=1&qlt=95&w=105&h=105",
      action: "Volunteer Now",
    },
    {
      title: "Silver Volunteer",
      desc: "Earned after 50 volunteer points",
      icon: "https://up.yimg.com/ib/th/id/OIP.8jVsS3Paqnphh1RUaZRO_gHaHa?pid=Api&rs=1&c=1&qlt=95&w=120&h=120",
      action: "Volunteer Now",
    },
    {
      title: "Gold Volunteer",
      desc: "Earned after 100 volunteer points",
      icon: "https://up.yimg.com/ib/th/id/OIP.M2jWfXFIT6yiFKdza-Xy9QHaHa?pid=Api&rs=1&c=1&qlt=95&w=121&h=121",
      action: "Volunteer Now",
    },
    {
      title: "Silver Donor",
      desc: "Earned after 50 donor points",
      icon: "https://up.yimg.com/ib/th/id/OIP.8jVsS3Paqnphh1RUaZRO_gHaHa?pid=Api&rs=1&c=1&qlt=95&w=120&h=120",
      action: "Donate Now",
    },
    {
      title: "Gold Donor",
      desc: "Earned after 100 donor points",
      icon: "https://up.yimg.com/ib/th/id/OIP.M2jWfXFIT6yiFKdza-Xy9QHaHa?pid=Api&rs=1&c=1&qlt=95&w=121&h=121",
      action: "Donate Now",
    },
    {
      title: "Platinum Donor",
      desc: "Earned after 200 donor points",
      icon: "https://tse3.mm.bing.net/th/id/OIP.Imd7GlakFy5b_od5xomrDAHaHa?pid=Api&P=0&h=180",
      action: "Donate Now",
    },
  ];

  return (
    <div className="badges-wrapper">
      <h1 className="badges-title">Badges</h1>

      <div className="badges-grid">
        {badges.map((b, i) => (
          <div className="badge-card" key={i}>
            <img src={b.icon} alt={b.title} className="badge-icon" />
            <h2>{b.title}</h2>
            <p>{b.desc}</p>

            {/* ✅ Added button */}
            <button
              className="badge-action-btn"
              onClick={() => navigate("/login")}
            >
              {b.action}
            </button>
          </div>
        ))}
      </div>

      <div className="back-btn">
        <button onClick={() => (window.location.href = "/")}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
