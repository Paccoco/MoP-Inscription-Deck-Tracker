import React, { useState, useEffect } from 'react';
import { useAutoRefresh } from './hooks';

function DeckValueHistory({ deckId }) {
  const [valueHistory, setValueHistory] = useState([]);
  const fetchValueHistory = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/decks/${deckId}/value-history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      throw { response: { status: 401 } };
    }
    const data = await res.json();
    setValueHistory(Array.isArray(data) ? data : []);
    return data;
  };
  const { sessionExpired, loading, error } = useAutoRefresh(fetchValueHistory, 30000);
  if (sessionExpired) return <div className="session-expired">Session expired. Please log in again.</div>;
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading data.</div>;

  return (
    <div>
      <h2>Deck Value History</h2>
      <ul>
        {valueHistory.map((entry, index) => (
          <li key={index}>{JSON.stringify(entry)}</li>
        ))}
      </ul>
    </div>
  );
}

export default DeckValueHistory;