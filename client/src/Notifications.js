import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
      setError('');
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

  const bulkMarkRead = async () => {
    const token = localStorage.getItem('token');
    await Promise.all(selected.map(id => axios.post('/api/notifications/read', { id }, {
      headers: { Authorization: `Bearer ${token}` }
    })));
    setSelected([]);
    fetchNotifications();
  };

  // Filtering and search
  const filtered = notifications.filter(n => {
    const matchesType = filterType === 'all' || (n.type && n.type === filterType);
    const matchesRead = filterRead === 'all' || (filterRead === 'read' ? n.read : !n.read);
    const matchesSearch = n.message.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesRead && matchesSearch;
  });

  // Pagination
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  // Notification types for filter dropdown
  const types = Array.from(new Set(notifications.map(n => n.type).filter(Boolean)));

  return (
    <div className="notifications-container">
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
      </div>
      {error && notifications.length === 0 ? (
        <div>No notifications.</div>
      ) : filtered.length === 0 ? (
        <div>No notifications match your filters.</div>
      ) : (
        <ul>
          {paginated.map(n => (
            <li key={n.id} style={{ marginBottom: 12, color: n.read ? '#888' : '#145c2c' }}>
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
              {n.message} <span style={{ fontSize: '0.9em', color: '#666' }}>({new Date(n.created_at).toLocaleString()})</span>
              {!n.read && <button style={{ marginLeft: 8 }} onClick={() => markRead(n.id)}>Mark as read</button>}
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
