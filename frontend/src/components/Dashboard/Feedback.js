import React, { useState } from "react";

export default function Feedback({ token, setMsg }) {
  const [feedback, setFeedback] = useState("");

  function submitFeedback(e) {
    e.preventDefault();

    if (!feedback.trim()) {
      setMsg("Feedback cannot be empty");
      return;
    }

    fetch((process.env.REACT_APP_API || "http://localhost:4000") + "/api/actions/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ text: feedback })
    })
      .then(r => r.json())
      .then(d => setMsg(d.message || d.msg || 'Feedback saved'));
  }

  return (
    <form onSubmit={submitFeedback}>
      <textarea
        placeholder="Write your feedback..."
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
      ></textarea>

      <button type="submit" style={{ backgroundColor: '#ff8f00' }}>Submit Feedback</button>

    </form>
  );
}
