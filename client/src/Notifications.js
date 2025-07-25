import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
      setError(''); // Clear error if request succeeds
    } catch (err) {
      setError('Failed to load notifications from server.');
    }
  };

  const markRead = async (id) => {
    const token = localStorage.getItem('token');
    await axios.post('/api/notifications/read', { id }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchNotifications();
  };

  return (
    <div className="notifications-container">
      <h2>Notifications</h2>
      {error && notifications.length === 0 ? (
        <div>No notifications.</div>
      ) : notifications.length === 0 ? (
        <div>No notifications.</div>
      ) : (
        <ul>
          {notifications.map(n => (
            <li key={n.id} style={{ marginBottom: 12, color: n.read ? '#888' : '#145c2c' }}>
              {n.message} <span style={{ fontSize: '0.9em', color: '#666' }}>({new Date(n.created_at).toLocaleString()})</span>
              {!n.read && <button style={{ marginLeft: 8 }} onClick={() => markRead(n.id)}>Mark as read</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
