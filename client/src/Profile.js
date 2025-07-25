import React, { useEffect, useState } from 'react';
import axios from 'axios';

const themes = [
  { name: 'MoP Green', value: 'mop-green' },
  { name: 'MoP Jade', value: 'mop-jade' },
  { name: 'MoP Dark', value: 'mop-dark' },
  { name: 'Classic', value: 'classic' }
];

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('theme') || 'mop-green');

  const handleThemeChange = (e) => {
    setSelectedTheme(e.target.value);
    localStorage.setItem('theme', e.target.value);
    document.body.className = e.target.value;
  };

  useEffect(() => {
    document.body.className = selectedTheme;
    const token = localStorage.getItem('token');
    axios.get('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load profile');
        setLoading(false);
      });
  }, [selectedTheme]);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div>No profile data found.</div>;

  return (
    <div className="profile-page">
      <h2>Profile: {profile.username}</h2>
      {/* Theme Selector */}
      <div style={{ margin: '20px 0' }}>
        <label htmlFor="theme-select"><strong>Theme Customization:</strong> </label>
        <select id="theme-select" value={selectedTheme} onChange={handleThemeChange}>
          {themes.map(theme => (
            <option key={theme.value} value={theme.value}>{theme.name}</option>
          ))}
        </select>
      </div>
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
      {/* Email Opt-In */}
      <div className="email-opt-in" style={{ margin: '20px 0' }}>
        <label htmlFor="emailOptIn">
          <strong>Email Notifications:</strong>
        </label>
        <input
          type="checkbox"
          id="emailOptIn"
          checked={profile.emailOptIn || false}
          onChange={e => {
            const token = localStorage.getItem('token');
            axios.post('/api/profile/email-opt-in', { optIn: e.target.checked }, { headers: { Authorization: `Bearer ${token}` } })
              .then(() => setProfile({ ...profile, emailOptIn: e.target.checked }))
              .catch(() => alert('Failed to update email opt-in status.'));
          }}
        />
        <span style={{ marginLeft: 8 }}>
          Opt-in for email alerts when a requested deck is completed or sold
        </span>
      </div>
    </div>
  );
}

export default Profile;
