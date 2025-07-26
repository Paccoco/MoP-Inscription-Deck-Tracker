import React, { useState, useEffect } from 'react';
import { useAutoRefresh } from './hooks';

function ActivityLog({ setShowPage }) {
  const [activity, setActivity] = useState([]);
  
  const fetchActivity = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/activity', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      throw { response: { status: 401 } };
    }
    const data = await res.json();
    setActivity(Array.isArray(data) ? data : []);
    return data;
  };
  
  const { sessionExpired, loading, error } = useAutoRefresh(fetchActivity, 30000);
  
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
  
  if (loading) return <div>Loading...</div>;
  
  if (error) return <div>Error loading activity.</div>;

  return (
    <div>
      <h1>Activity Log</h1>
      <ul>
        {activity.map((item) => (
          <li key={item.id}>{item.action} - {item.timestamp}</li>
        ))}
      </ul>
    </div>
  );
}

export default ActivityLog;