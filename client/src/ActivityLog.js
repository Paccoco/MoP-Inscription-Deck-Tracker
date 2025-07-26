import React, { useState, useEffect } from 'react';
import { useAutoRefresh } from './hooks';

function ActivityLog() {
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
  
  if (sessionExpired) return <div className="session-expired">Session expired. Please log in again.</div>;
  
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