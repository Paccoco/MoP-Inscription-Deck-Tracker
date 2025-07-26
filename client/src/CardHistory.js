import React, { useState, useEffect } from 'react';
import { useAutoRefresh } from './hooks';

function CardHistory({ cardId, setShowPage }) {
  const [history, setHistory] = useState([]);
  const fetchHistory = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/cards/${cardId}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      throw { response: { status: 401 } };
    }
    const data = await res.json();
    setHistory(Array.isArray(data) ? data : []);
    return data;
  };
  const { sessionExpired, loading, error } = useAutoRefresh(fetchHistory, 30000);
  if (sessionExpired) {
    return (
      <div className="session-expired">
        Session expired. Please log in again.<br />
        <button onClick={() => setShowPage('login')}>Login</button>
        <button onClick={() => setShowPage('register')}>Register</button>
      </div>
    );
  }
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading history.</div>;

  return (
    <div>
      <h2>Card History</h2>
      <ul>
        {history.map((item) => (
          <li key={item.id}>{item.action} - {new Date(item.date).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
}

export default CardHistory;