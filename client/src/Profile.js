import React, { useEffect, useState } from 'react';
import axios from 'axios';
import GotifyConfig from './GotifyConfig';
import { useAutoRefresh } from './hooks';

const themes = [
  { name: 'MoP Green', value: 'mop-green' },
  { name: 'MoP Jade', value: 'mop-jade' },
  { name: 'MoP Dark', value: 'mop-dark' },
  { name: 'Classic', value: 'classic' }
];

function Profile({ setShowPage }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('theme') || 'mop-green');

  const handleThemeChange = (e) => {
    setSelectedTheme(e.target.value);
    localStorage.setItem('theme', e.target.value);
    document.body.className = e.target.value;
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
    setProfile(res.data);
    setLoading(false);
    return res.data;
  };

  const { sessionExpired, loading: autoLoading, error: autoError } = useAutoRefresh(fetchProfile, 30000);

  useEffect(() => {
    document.body.className = selectedTheme;
    fetchProfile();
  }, [selectedTheme]);

  if (loading || autoLoading) return <div>Loading profile...</div>;
  if (autoError) return <div className="error">{autoError}</div>;
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
  if (!profile) return <div>No profile data found.</div>;

  return (
    <div className="profile-card">
      <h2 className="section-header">Profile: {profile.username}</h2>
      {/* Theme Selector */}
      <div style={{ margin: '20px 0' }}>
        <label htmlFor="theme-select"><strong>Theme Customization:</strong> </label>
        <select id="theme-select" value={selectedTheme} onChange={handleThemeChange}>
          {themes.map(theme => (
            <option key={theme.value} value={theme.value}>{theme.name}</option>
          ))}
        </select>
      </div>
      <GotifyConfig />
      <h3>Your Cards</h3>
      {profile.cards && profile.cards.length > 0 ? (
        <ul>
          {profile.cards.map(card => (
            <li key={card.id}>{card.card_name} ({card.deck})</li>
          ))}
        </ul>
      ) : <div>No cards owned.</div>}
      <h3>Completed Decks</h3>
      {profile.completedDecks && profile.completedDecks.length > 0 ? (
        <ul>
          {profile.completedDecks.map(deck => (
            <li key={deck.id}>{deck.deck} ({deck.disposition})</li>
          ))}
        </ul>
      ) : <div>No completed decks.</div>}
      <h3>Payouts</h3>
      {profile.payouts && profile.payouts.length > 0 ? (
        <ul>
          {profile.payouts.map((p, i) => (
            <li key={i}>{p.deck}: {p.amount} gold</li>
          ))}
        </ul>
      ) : <div>No payouts yet.</div>}
      <h3>Recent Activity</h3>
      {profile.activity && profile.activity.length > 0 ? (
        <ul>
          {profile.activity.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      ) : <div>No recent activity.</div>}
    </div>
  );
}

export default Profile;
