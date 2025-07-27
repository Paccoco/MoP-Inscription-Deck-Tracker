import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DiscordWebhookConfig from './DiscordWebhookConfig';
import ExportImport from './ExportImport';
import { useAutoRefresh } from './hooks';
import AdminAnnouncement from './AdminAnnouncement';

function Admin({ setShowPage }) {
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState('');
  const [completedDecks, setCompletedDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [disposition, setDisposition] = useState('fulfilled');
  const [recipient, setRecipient] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [payouts, setPayouts] = useState(null);
  const [guildCut, setGuildCut] = useState(null);
  const [serverVersion, setServerVersion] = useState('');

  // Summary stats
  const [notificationStats, setNotificationStats] = useState({ total: 0, unread: 0 });
  const [recentActivity, setRecentActivity] = useState([]);

  // Security Dashboard State
  const [securityScan, setSecurityScan] = useState(null);
  const [dependencyStatus, setDependencyStatus] = useState(null);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [securityError, setSecurityError] = useState('');

  const fetchAllAdminData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [usersRes, pendingRes, completedDecksRes, notificationStatsRes, recentActivityRes, securityScanRes, dependencyStatusRes, notificationHistoryRes] = await Promise.all([
        axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/pending', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/completed-unallocated-decks', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/notification-stats', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/activity/all', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/security-scan', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/dependency-status', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/notification-history', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(usersRes.data);
      setPending(pendingRes.data);
      setCompletedDecks(completedDecksRes.data);
      setNotificationStats(notificationStatsRes.data);
      setRecentActivity(recentActivityRes.data.slice(0, 5));
      setSecurityScan(securityScanRes.data);
      setDependencyStatus(dependencyStatusRes.data);
      setNotificationHistory(notificationHistoryRes.data);
      setSecurityError('');
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError('Failed to load admin data.');
      }
    }
  };

  const { sessionExpired, loading, error: autoError } = useAutoRefresh(fetchAllAdminData, 30000);

  useEffect(() => {
    fetchAllAdminData();
    // Fetch server version
    axios.get('/api/version').then(res => {
      setServerVersion(res.data.version);
    }).catch(() => {
      setServerVersion('unknown');
    });
  }, []);

  const approveUser = async (userId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('/api/admin/approve', { userId }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setPending(pending.filter(u => u.id !== userId));
    } catch (err) {
      alert('Failed to approve user');
    }
  };

  // Complete a deck (fulfill or sell)
  const handleCompleteDeck = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('/api/admin/complete-deck', {
        deckId: selectedDeckId,
        disposition,
        recipient,
        salePrice: disposition === 'sold' ? parseFloat(salePrice) : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayouts(res.data.payouts || null);
      setGuildCut(res.data.guildCut || null);
      alert('Deck completed!');
    } catch (err) {
      alert('Failed to complete deck');
    }
  };

  // Remove user access (admin only)
  const handleRemoveUser = async (username) => {
    const token = localStorage.getItem('token');
    if (!window.confirm(`Are you sure you want to remove access for ${username}?`)) return;
    try {
      await axios.post('/api/admin/remove-user', { username }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.filter(u => u.username !== username));
      alert(`User ${username} removed.`);
    } catch (err) {
      alert('Failed to remove user.');
    }
  };

  // Navigation handlers
  const goHome = () => {
    if (setShowPage) setShowPage('dashboard');
    else window.location.href = '/';
  };

  const handleSetAnnouncement = async (data) => {
    console.log('Setting announcement with data:', data);
    try {
      const response = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      console.log('Announcement API response:', result);
      
      if (response.ok) {
        alert('Announcement pushed successfully!');
      } else {
        alert(`Failed to push announcement: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error pushing announcement:', error);
      alert(`Error pushing announcement: ${error.message}`);
    }
  };
  const handleClearAnnouncement = async () => {
    console.log('Clearing announcements...');
    try {
      const response = await fetch('/api/admin/announcement', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const result = await response.json();
      console.log('Clear announcement API response:', result);
      
      if (response.ok) {
        alert('Announcements cleared successfully!');
      } else {
        alert(`Failed to clear announcements: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error clearing announcements:', error);
      alert(`Error clearing announcements: ${error.message}`);
    }
  };

  const token = localStorage.getItem('token');
  let decodedUser = null;
  try {
    decodedUser = token ? JSON.parse(atob(token.split('.')[1])) : null;
  } catch (e) {
    decodedUser = null;
  }
  // Use user object from backend if available, fallback to decoded token
  const currentUser = users.find(u => u.username === decodedUser?.username);
  const isAdmin = currentUser?.is_admin === 1 || currentUser?.is_admin === true;

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
    <div className="admin-card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1em', gap: '1em' }}>
        <button onClick={goHome}>Home</button>
        <h2 style={{ margin: 0 }}>Admin Panel</h2>
        <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#4caf50' }}>Server Version: {serverVersion}</span>
      </div>
      <div style={{ display: 'flex', gap: '2em', marginBottom: '1em' }}>
        <div>
          <strong>Pending Approvals:</strong> {pending.length}
        </div>
        <div>
          <strong>Total Users:</strong> {users.length}
        </div>
        <div>
          <strong>Notifications:</strong> {notificationStats.total} total, {notificationStats.unread} unread
        </div>
        <div>
          <strong>Recent Activity:</strong>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {recentActivity.length === 0 ? <li>No recent activity.</li> : recentActivity.map((a, i) => (
              <li key={i}>{a.action} <span style={{ fontSize: '0.9em', color: '#666' }}>({new Date(a.timestamp).toLocaleString()})</span></li>
            ))}
          </ul>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-card">
        <h3>Pending Users</h3>
        <ul>
          {pending.length === 0 && <li>No pending users.</li>}
          {pending.map(u => (
            <li key={u.id}>
              {u.username} <button onClick={() => approveUser(u.id)}>Approve</button>
            </li>
          ))}
        </ul>
        <h3>All Users</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Admin</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.is_admin ? 'Yes' : 'No'}</td>
                <td>
                  <button onClick={() => handleRemoveUser(u.username)} style={{ color: 'red' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Complete Deck</h3>
        <form onSubmit={handleCompleteDeck}>
          <select value={selectedDeckId} onChange={e => setSelectedDeckId(e.target.value)} required>
            <option value="">Select Completed Deck</option>
            {completedDecks.map(deck => (
              <option key={deck.id} value={deck.id}>
                {deck.deck} (Completed: {new Date(deck.completed_at).toLocaleDateString()})
              </option>
            ))}
          </select>
          <select value={disposition} onChange={e => setDisposition(e.target.value)} required>
            <option value="fulfilled">Fulfill Deck Request</option>
            <option value="sold">Sell Deck</option>
          </select>
          {disposition === 'sold' && (
            <>
              <input type="number" placeholder="Sale Price" value={salePrice} onChange={e => setSalePrice(e.target.value)} required />
              <input placeholder="Recipient (buyer)" value={recipient} onChange={e => setRecipient(e.target.value)} />
            </>
          )}
          <button type="submit">Complete Deck</button>
        </form>
        {payouts && (
          <div>
            <h4>Payouts</h4>
            <ul>
              {payouts.map(p => (
                <li key={p.owner}>{p.owner}: {p.payout} gold</li>
              ))}
            </ul>
            <div>Guild Cut: {guildCut} gold</div>
          </div>
        )}
        <h3>Completed Decks</h3>
        <table>
          <thead>
            <tr>
              <th>Deck</th>
              <th>Contributors</th>
              <th>Completed At</th>
              <th>Disposition</th>
              <th>Recipient</th>
            </tr>
          </thead>
          <tbody>
            {completedDecks.length === 0 ? (
              <tr><td colSpan="5">No completed decks found.</td></tr>
            ) : completedDecks.map(deck => (
              <tr key={deck.id}>
                <td>{deck.deck}</td>
                <td>{JSON.parse(deck.contributors).map(c => c.owner).join(', ')}</td>
                <td>{new Date(deck.completed_at).toLocaleString()}</td>
                <td>{deck.disposition}</td>
                <td>{deck.recipient || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="security-dashboard" style={{ margin: '2em 0', padding: '1em', border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Security Dashboard</h2>
        {securityError && <div className="error">{securityError}</div>}
        <div>
          <h3>Security Scan Results</h3>
          {securityScan ? (
            <div>
              <div><strong>npm audit:</strong> {securityScan.npm_audit.summary.total_issues} issues found <span style={{ color: '#888' }}>({new Date(securityScan.npm_audit.date).toLocaleString()})</span></div>
              <div><strong>ggshield:</strong> {securityScan.ggshield.summary.total_issues} issues found <span style={{ color: '#888' }}>({new Date(securityScan.ggshield.date).toLocaleString()})</span></div>
              <button onClick={() => window.open('/security-scan.json', '_blank')}>Export Security Scan JSON</button>
              <a href="https://github.com/Paccoco/project-card-tracker/actions?query=workflow%3A%22Security+%26+Dependency+Audit%22" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 16 }}>View CI Logs</a>
            </div>
          ) : <div>Loading security scan...</div>}
        </div>
        <div>
          <h3>Dependency Status</h3>
          {dependencyStatus ? (
            <div>
              <div><strong>Total Dependencies:</strong> {dependencyStatus.total_dependencies}</div>
              <div><strong>Outdated:</strong> {dependencyStatus.outdated}</div>
              <div><strong>Up to Date:</strong> {dependencyStatus.up_to_date}</div>
              {dependencyStatus.details && dependencyStatus.details.length > 0 && (
                <ul>
                  {dependencyStatus.details.map((dep, i) => (
                    <li key={i}>
                      {dep.package}: {dep.current_version} → {dep.latest_version} ({dep.status})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : <div>Loading dependency status...</div>}
        </div>
        <div>
          <h3>Security & System Notification History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Message</th>
                <th>User</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {notificationHistory.length === 0 ? (
                <tr><td colSpan={3}>No notifications found.</td></tr>
              ) : notificationHistory.map((n, i) => (
                <tr key={i}>
                  <td>{n.message}</td>
                  <td>{n.username}</td>
                  <td>{n.created_at ? new Date(n.created_at).toLocaleString() : 'Unknown date'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="action-buttons">
        <h3>Discord Integration</h3>
        <DiscordWebhookConfig />
        <h3>Export / Import Data</h3>
        <ExportImport isAdmin={true} />
      </div>
      {isAdmin && <AdminAnnouncement onSet={handleSetAnnouncement} onClear={handleClearAnnouncement} />}
    </div>
  );
}

export default Admin;
