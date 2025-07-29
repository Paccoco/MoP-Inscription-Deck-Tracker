import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { createApiUrl } from './apiConfig';

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(createApiUrl('/api/auth/login'), form);
      localStorage.setItem('token', res.data.token);
      const decoded = jwtDecode(res.data.token);
      onLogin({
        username: decoded.username,
        isAdmin: decoded.is_admin || false
      });
    } catch (err) {
      if (err.response?.data?.error === 'Account not approved by admin yet.') {
        setError('Your account is pending admin approval.');
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default Login;
