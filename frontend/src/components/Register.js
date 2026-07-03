import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const navigate = useNavigate();

  const [name,setName] = useState('');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [role,setRole] = useState('Volunteer/Donor');
  const [msg,setMsg] = useState('');

  async function submit(e){
    e.preventDefault();
    if (role === 'Admin'){
      setMsg('Admin cannot register');
      return;
    }

    try{
      const res = await fetch((process.env.REACT_APP_API || 'http://localhost:4000') + '/api/auth/register',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name,email,password,role})
      });

      const data = await res.json();

      if (res.ok){
        setMsg('Registered successfully. Please login.');
        setTimeout(() => navigate('/login'), 1500);
      }else{
        setMsg(data.message || 'Registration failed');
      }
    }catch(e){
      setMsg('Server error');
    }
  }

  return (
    <div className="auth">
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input required placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
        <input required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option>Volunteer/Donor</option>
          <option>NGO</option>
        </select>
        <button type="submit">Register</button>
      </form>
      <p className="msg">{msg}</p>
    </div>
  );
}
