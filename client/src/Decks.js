import React, { useState, useEffect } from 'react';
import './Decks.css';

const Decks = () => {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showPage, setShowPage] = useState('decks');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setSessionExpired(true);
    }
  }, []);

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

  if (sessionExpired) {
    return (
      <div className="session-expired">
        Session expired. Please log in again.<br />
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleRegister}>Register</button>
      </div>
    );
  }

  return (
    <div className="decks-page">
      {/* ...existing code for decks page... */}
    </div>
  );
};

export default Decks;