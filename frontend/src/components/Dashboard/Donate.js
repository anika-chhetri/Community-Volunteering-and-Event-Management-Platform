import React, { useState, useEffect } from "react";

export default function Donate({ token, setMsg }) {
  const [amount, setAmount] = useState("");
  const [ngoId, setNgoId] = useState("");
  const [ngos, setNgos] = useState([]);

  useEffect(()=>{
    // fetch NGO list for donate target (public endpoint requires auth in demo)
    (async ()=>{
      try{
        const res = await fetch((process.env.REACT_APP_API || 'http://localhost:4000') + '/api/actions/ngos', { headers: token ? { Authorization:`Bearer ${token}` } : {} });
        if (!res.ok) throw new Error('Failed to load NGOs');
        const d = await res.json(); setNgos(d.ngos || []);
        if (d.ngos && d.ngos.length) setNgoId(String(d.ngos[0].id));
      }catch(e){ /* ignore */ }
    })();
  },[token]);

  function donateSubmit(e) {
    e.preventDefault();

    if (!amount) {
      setMsg("Enter donation amount");
      return;
    }

    fetch((process.env.REACT_APP_API || "http://localhost:4000") + "/api/actions/donate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount, ngo_id: ngoId || null })
    })
      .then(r => r.json())
      .then(d => setMsg(d.message || d.msg || 'Donation recorded'));
  }

  return (
    <form onSubmit={donateSubmit}>
      <select value={ngoId} onChange={e=>setNgoId(e.target.value)}>
        <option value="">-- Select NGO (optional) --</option>
        {ngos.map(n=> (<option key={n.id} value={n.id}>{n.name} ({n.email})</option>))}
      </select>

      <input
        type="number"
        placeholder="Enter donation amount (₹)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />

      <button type="submit" style={{ backgroundColor: "#52c41a" }}>Donate</button>

    </form>
  );
}
