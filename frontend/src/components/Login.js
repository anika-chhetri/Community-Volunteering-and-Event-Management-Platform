import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [role,setRole] = useState('Volunteer/Donor');
  const [msg,setMsg] = useState('');

  async function submit(e){
    e.preventDefault();
    try{
      const res = await fetch((process.env.REACT_APP_API || 'http://localhost:4000') + '/api/auth/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,password,role})
      });

      const data = await res.json();

      if (res.ok){
        onLogin(data.token, {
          name: data.name,
          email: data.email,
          role: data.role
        });

        // navigate after login
        navigate('/');
      } else {
        setMsg(data.message || 'Login failed');
      }
    }catch(e){
      setMsg('Server error');
    }
  }

  return (
    <div className="auth">
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option>Volunteer/Donor</option>
          <option>NGO</option>
          <option>Admin</option>
        </select>
        <button type="submit">Login</button>
      </form>

      <p className="msg">{msg}</p>

      <p>
        Don't have account?{" "}
        <button onClick={() => navigate('/register')}>
          Register
        </button>
      </p>

      <p style={{marginTop:12,color:'#555'}}>
        Admin accounts cannot register from the site. Use Admin credentials provided by the system.
      </p>
    </div>
  );
}
