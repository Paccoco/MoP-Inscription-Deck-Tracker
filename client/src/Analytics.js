import React, { useState, useEffect } from 'react';
import { useAutoRefresh } from './hooks';

function Analytics({ setShowPage }) {
  const [analytics, setAnalytics] = useState(null);
  const fetchAnalytics = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/analytics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      throw { response: { status: 401 } };
    }
    const data = await res.json();
    setAnalytics(data);
    return data;
  };
  const { sessionExpired, loading, error } = useAutoRefresh(fetchAnalytics, 30000);
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
  if (error) return <div>Error loading analytics.</div>;

  return (
    <div>
      <h1>Analytics</h1>
      {/* Render analytics data */}
    </div>
  );
}

export default Analytics;