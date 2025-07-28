import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAutoRefresh } from './hooks';

const NOTIFICATION_TYPES = [
  { key: 'deck_complete', label: 'Deck Completed' },
  { key: 'approval', label: 'Account Approved' },
  { key: 'payout', label: 'Payout Received' },
  { key: 'deck_request', label: 'Deck Request Updates' }
];

export default function GotifyConfig({ setShowPage }) {
  const [server, setServer] = useState('');
  const [token, setToken] = useState('');
  const [types, setTypes] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/gotify/config', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setServer(res.data.server || '');
        setToken(res.data.token || '');
        setTypes(res.data.types || []);
      });
  }, []);

  const saveConfig = async () => {
    const jwt = localStorage.getItem('token');
    console.log('GotifyConfig: JWT token being sent:', jwt);
    try {
      const res = await axios.post('/api/gotify/config', { server, token, types }, { headers: { Authorization: jwt ? `Bearer ${jwt}` : '' } });
      setMessage('Gotify settings saved!');
      console.log('Gotify save response:', res.data);
    } catch (err) {
      setMessage('Failed to save Gotify settings.');
      console.error('Gotify save error:', err);
      if (err.response) {
        setMessage('Failed to save Gotify settings: ' + (err.response.data?.error || err.response.status));
      }
    }
  };

  const handleTypeChange = (typeKey) => {
    setTypes(types.includes(typeKey)
      ? types.filter(t => t !== typeKey)
      : [...types, typeKey]);
  };

  const fetchConfig = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gotify/config', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      throw new Error('Session expired');
    }
    const data = await res.json();
    setServer(data.server || '');
    setToken(data.token || '');
    setTypes(data.types || []);
    return data;
  };
  const { sessionExpired } = useAutoRefresh(fetchConfig, 30000);
  if (sessionExpired) {
    const handleLogin = () => {
      localStorage.removeItem('token');
      setShowPage('login');
      window.location.reload();
    };
    const handleRegister = () => {
      localStorage.removeItem('token');
      setShowPage('register');
      window.location.reload();
    };
    return (
      <div className="session-expired">
        Session expired. Please log in again.<br />
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleRegister}>Register</button>
      </div>
    );
  }

  return (
    <div className="table-card" style={{ margin: '20px 0' }}>
      <h3>Gotify Notifications <span title="Configure your personal Gotify server and select which notification types you want to receive. Gotify is a self-hosted push notification service.">🛈</span></h3>
      <div style={{ marginBottom: 8 }}>
        <label>Gotify Server URL: <input value={server} onChange={e => setServer(e.target.value)} placeholder="https://gotify.example.com" style={{ width: 260 }} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <label>Gotify Token: <input value={token} onChange={e => setToken(e.target.value)} placeholder="Your Gotify token" style={{ width: 260 }} /></label>
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>Notification Types:</strong>
        <div>
          {NOTIFICATION_TYPES.map(nt => (
            <label key={nt.key} style={{ marginRight: 16 }}>
              <input
                type="checkbox"
                checked={types.includes(nt.key)}
                onChange={() => handleTypeChange(nt.key)}
              />
              {nt.label}
              <span title={`Enable/disable notifications for ${nt.label}`}> 🛈</span>
            </label>
          ))}
        </div>
      </div>
      <button onClick={saveConfig}>Save Gotify Settings</button>
      {message && <div style={{ color: message.includes('Failed') ? 'red' : 'green', marginTop: 8 }}>{message}</div>}
    </div>
  );
}
