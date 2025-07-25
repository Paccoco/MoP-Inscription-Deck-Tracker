import React, { useEffect, useState } from 'react';
import axios from 'axios';

function GotifyConfig() {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const tokenLocal = localStorage.getItem('token');
    axios.get('/api/gotify/config', {
      headers: { Authorization: `Bearer ${tokenLocal}` }
    }).then(res => {
      if (res.data.gotify) {
        setUrl(res.data.gotify.url || '');
        setToken(res.data.gotify.token || '');
      }
    });
  }, []);

  const handleSave = async e => {
    e.preventDefault();
    const tokenLocal = localStorage.getItem('token');
    try {
      await axios.post('/api/gotify/config', { url, token }, {
        headers: { Authorization: `Bearer ${tokenLocal}` }
      });
      setStatus('Saved!');
    } catch {
      setStatus('Failed to save');
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h4>Gotify Notification Setup</h4>
      <form onSubmit={handleSave}>
        <input
          type="text"
          placeholder="Gotify Server URL (e.g. https://gotify.example.com)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 8 }}
        />
        <input
          type="text"
          placeholder="Gotify App Token"
          value={token}
          onChange={e => setToken(e.target.value)}
          required
          style={{ width: '100%', marginBottom: 8 }}
        />
        <button type="submit">Save Gotify Settings</button>
      </form>
      {status && <div style={{ color: status === 'Saved!' ? 'green' : 'red' }}>{status}</div>}
    </div>
  );
}

export default GotifyConfig;
