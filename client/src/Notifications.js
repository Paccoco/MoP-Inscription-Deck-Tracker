import React, { useState } from 'react';
import axios from 'axios';
import { useAutoRefresh } from './hooks';

export default function Notifications({ setShowPage }) {
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    const res = await axios.get('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(res.data);
    return res.data;
  };

  const { sessionExpired, loading, error } = useAutoRefresh(fetchNotifications, 30000);

  const markRead = async (id) => {
    const token = localStorage.getItem('token');
    await axios.post('/api/notifications/read', { id }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchNotifications();
  };

  const bulkMarkRead = async () => {
    const token = localStorage.getItem('token');
    await Promise.all(selected.map(id => axios.post('/api/notifications/read', { id }, {
      headers: { Authorization: `Bearer ${token}` }
    })));
    setSelected([]);
    fetchNotifications();
  };

  const deleteNotification = async (id) => {
    const token = localStorage.getItem('token');
    await axios.delete(`/api/notifications/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchNotifications();
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete ALL notifications? This cannot be undone.')) return;
    const token = localStorage.getItem('token');
    await axios.delete('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSelected([]);
    fetchNotifications();
  };

  const filtered = notifications.filter(n => {
    const matchesType = filterType === 'all' || (n.type && n.type === filterType);
    const matchesRead = filterRead === 'all' || (filterRead === 'read' ? n.read : !n.read);
    const matchesSearch = n.message.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesRead && matchesSearch;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const types = Array.from(new Set(notifications.map(n => n.type).filter(Boolean)));

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

  return (
    <div className="notifications-card">
      <h2>Notifications</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search notifications..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ marginRight: 8 }}>
          <option value="all">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterRead} onChange={e => setFilterRead(e.target.value)} style={{ marginRight: 8 }}>
          <option value="all">All</option>
          <option value="read">Read</option>
          <option value="unread">Unread</option>
        </select>
        <button disabled={selected.length === 0} onClick={bulkMarkRead}>Mark Selected as Read</button>
        <button style={{ marginLeft: 8, background: '#c00', color: '#fff' }} onClick={deleteAllNotifications}>Delete All</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error && notifications.length === 0 ? (
        <div>No notifications.</div>
      ) : filtered.length === 0 ? (
        <div>No notifications match your filters.</div>
      ) : (
        <ul className="notifications-list">
          {paginated.map(n => (
            <li key={n.id} className="notification-item">
              <div className="notification-content">
                <input
                  type="checkbox"
                  checked={selected.includes(n.id)}
                  onChange={e => {
                    setSelected(e.target.checked
                      ? [...selected, n.id]
                      : selected.filter(id => id !== n.id));
                  }}
                  style={{ marginRight: 8 }}
                />
                <span>{n.message}</span>
                <span className="notification-date">
                  {n.created_at ? new Date(n.created_at).toLocaleString() : 'Unknown date'}
                </span>
                {!n.read && <button style={{ marginLeft: 8 }} onClick={() => markRead(n.id)}>Mark as read</button>}
              </div>
              <div className="notification-actions">
                <button style={{ background: '#c00', color: '#fff' }} onClick={() => deleteNotification(n.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <div style={{ marginTop: 16 }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span style={{ margin: '0 8px' }}>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
