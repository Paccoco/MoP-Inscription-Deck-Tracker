import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DiscordWebhookConfig from './DiscordWebhookConfig';
import ExportImport from './ExportImport';
import { useAutoRefresh } from './hooks';

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
              <li key={i}>{a.message} <span style={{ fontSize: '0.9em', color: '#666' }}>({new Date(a.created_at).toLocaleString()})</span></li>
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
              <option key={deck.id} value={deck.id}>{deck.name} (Contributors: {deck.contributors.map(c => c.owner).join(', ')})</option>
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
        <h3>Completed Decks Progress</h3>
        <table>
          <thead>
            <tr>
              <th>Deck</th>
              <th>Contributors</th>
              <th>Progress</th>
              <th>Completed At</th>
            </tr>
          </thead>
          <tbody>
            {completedDecks.map(deck => (
              <tr key={deck.id}>
                <td>{deck.name}</td>
                <td>{deck.contributors.map(c => c.owner).join(', ')}</td>
                <td>
                  {typeof deck.collectedCards === 'number' && typeof deck.totalCards === 'number' ? (
                    <div style={{ minWidth: 180 }}>
                      <div style={{ background: '#eee', borderRadius: '4px', height: '16px', width: '100%' }}>
                        <div
                          style={{
                            width: `${Math.round((deck.collectedCards / deck.totalCards) * 100)}%`,
                            background: '#4caf50',
                            height: '100%',
                            borderRadius: '4px',
                            transition: 'width 0.5s',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '12px' }}>
                        {deck.collectedCards} / {deck.totalCards} cards ({Math.round((deck.collectedCards / deck.totalCards) * 100)}%)
                      </span>
                    </div>
                  ) : 'N/A'}
                </td>
                <td>{deck.completed_at ? new Date(deck.completed_at).toLocaleString() : 'N/A'}</td>
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
              <div><strong>npm audit:</strong> {securityScan.npm_audit.summary} <span style={{ color: '#888' }}>({new Date(securityScan.npm_audit.date).toLocaleString()})</span></div>
              <div><strong>ggshield:</strong> {securityScan.ggshield.summary} <span style={{ color: '#888' }}>({new Date(securityScan.ggshield.date).toLocaleString()})</span></div>
              <button onClick={() => window.open('/security-scan.json', '_blank')}>Export Security Scan JSON</button>
              <a href="https://github.com/Paccoco/project-card-tracker/actions?query=workflow%3A%22Security+%26+Dependency+Audit%22" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 16 }}>View CI Logs</a>
            </div>
          ) : <div>Loading security scan...</div>}
        </div>
        <div>
          <h3>Dependency Status</h3>
          {dependencyStatus ? (
            <div>
              <div><strong>Outdated:</strong> {dependencyStatus.outdated.length}</div>
              <div><strong>Vulnerable:</strong> {dependencyStatus.vulnerable.length}</div>
              {dependencyStatus.outdated.length > 0 && (
                <ul>{dependencyStatus.outdated.map((dep, i) => <li key={i}>{dep}</li>)}</ul>
              )}
              {dependencyStatus.vulnerable.length > 0 && (
                <ul>{dependencyStatus.vulnerable.map((dep, i) => <li key={i}>{dep}</li>)}</ul>
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
                  <td>{new Date(n.created_at).toLocaleString()}</td>
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
    </div>
  );
}

export default Admin;
