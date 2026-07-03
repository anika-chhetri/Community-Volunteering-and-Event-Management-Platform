import React, { useEffect } from 'react';
import './About.css';

export default function About() {

  useEffect(() => {
    // Add background class when About loads
    document.body.classList.add("about-background");

    // Remove when leaving About page
    return () => {
      document.body.classList.remove("about-background");
    };
  }, []);

  return (
    <div className="about">
      <h2>About Us</h2>
      <p> HelpingHands is a dedicated non-profit organization working across multiple sectors to uplift underprivileged communities in India.</p> <p> Its initiatives span education, healthcare, women empowerment, and community support programs, all designed to create sustainable and meaningful impact. The organization collaborates with passionate volunteers from different parts of the country, enabling them to contribute their time and skills through teaching, awareness drives, medical camps, skill-development workshops, and various outreach activities. </p> <p>Together, HelpingHands and its volunteer network strive to build stronger, healthier, and more empowered communities, ensuring that essential opportunities and resources reach those who need them most.</p>
    </div>
  );
}