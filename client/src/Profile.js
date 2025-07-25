import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, []);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div>No profile data found.</div>;

  return (
    <div className="profile-page">
      <h2>Profile: {profile.username}</h2>
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
