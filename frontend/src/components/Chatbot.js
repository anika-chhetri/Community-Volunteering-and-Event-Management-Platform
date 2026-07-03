import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! I am here to help. Try: events, donate, volunteer",
    },
  ]);
  const [text, setText] = useState("");

  const navigate = useNavigate();

  // Handle clickable suggestion buttons (backend now returns objects {key,label})
  function handleButtonClick(b) {
    if (!b) return;
    // support both string and object buttons
    const key = typeof b === 'string' ? b.toLowerCase() : (b.key || '').toLowerCase();
    const label = typeof b === 'string' ? b : (b.label || '');

    if (key === 'events' || label.toLowerCase().includes('event')) { navigate('/events'); return; }
    if (key === 'donate' || label.toLowerCase().includes('donate')) { navigate('/dashboard'); return; }
    if (key === 'volunteer' || label.toLowerCase().includes('volunt')) { navigate('/events'); return; }
    if (key === 'contact' || label.toLowerCase().includes('contact')) { navigate('/'); setTimeout(()=>{ const el = document.getElementById('contact-section'); if (el) el.scrollIntoView({behavior:'smooth'}); },100); return; }

    // Default: send as chat text
    send(typeof b === 'string' ? b : (b.label || ''));
  }

  async function send(msg) {
    if (!msg.trim()) return;

    // Add user's message
    setMessages((prev) => [...prev, { from: "user", text: msg }]);
    setText("");

    try {
      const res = await fetch(
        (process.env.REACT_APP_API || "http://localhost:4000") + "/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg }),
        }
      );

      const data = await res.json();

      // Add bot reply
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: data.reply || "I didn't understand that.",
          buttons: data.buttons || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Service unavailable. Please try later." },
      ]);
    }
  }

  return (
    <div className="chatbot">
      <button className="chat-toggle" onClick={() => setOpen(!open)}>
        {open ? "Close Chat" : "Chat with us"}
      </button>

      {open && (
        <div className="chat-window">
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                <div>{m.text}</div>

                {/* Clickable suggestion buttons from backend */}
                {m.buttons && m.buttons.length > 0 && (
                  <div className="buttons" style={{ marginTop: 8 }}>
                    {m.buttons.map((b, bi) => (
                      <button
                        key={bi}
                        onClick={() => handleButtonClick(b)}
                        className="primary"
                      >
                        {typeof b === 'string' ? b : b.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message"
              onKeyDown={(e) => {
                if (e.key === "Enter") send(text);
              }}
            />
            <button onClick={() => send(text)}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
