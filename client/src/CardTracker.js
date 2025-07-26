import React, { useState } from 'react';
import { useAutoRefresh } from './hooks';

function CardTracker({ setShowPage }) {
  const [cards, setCards] = useState([]);
  const fetchCards = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/cards', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      throw { response: { status: 401 } };
    }
    const data = await res.json();
    setCards(Array.isArray(data) ? data : []);
    return data;
  };
  const { sessionExpired, loading, error } = useAutoRefresh(fetchCards, 30000);
  if (sessionExpired) {
    return (
      <div className="session-expired">
        Session expired. Please log in again.<br />
        <button onClick={() => setShowPage('login')}>Login</button>
        <button onClick={() => setShowPage('register')}>Register</button>
      </div>
    );
  }

  return (
    <div>
      {/* Render cards or loading/error state */}
    </div>
  );
}

export default CardTracker;