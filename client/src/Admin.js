import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DiscordWebhookConfig from './DiscordWebhookConfig';
import ExportImport from './ExportImport';

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {
        setError('Failed to load users or not admin');
      }
    };
    const fetchPending = async () => {
      try {
        const res = await axios.get('/api/admin/pending', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPending(res.data);
      } catch {}
    };
    const fetchCompletedDecks = async () => {
      try {
        const res = await axios.get('/api/admin/completed-unallocated-decks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompletedDecks(res.data);
      } catch {}
    };
    const fetchNotificationStats = async () => {
      try {
        const res = await axios.get('/api/admin/notification-stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotificationStats(res.data);
      } catch {}
    };
    const fetchRecentActivity = async () => {
      try {
        const res = await axios.get('/api/activity/all', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRecentActivity(res.data.slice(0, 5)); // Show last 5 activities
      } catch {}
    };
    fetchUsers();
    fetchPending();
    fetchCompletedDecks();
    fetchNotificationStats();
    fetchRecentActivity();
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

  // Navigation handlers
  const goHome = () => {
    if (setShowPage) setShowPage('dashboard');
    else window.location.href = '/';
  };

  return (
    <div className="admin-container">
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
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.is_admin ? 'Yes' : 'No'}</td>
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
      <h3>Discord Integration</h3>
      <DiscordWebhookConfig />
      <h3>Export / Import Data</h3>
      <ExportImport isAdmin={true} />
    </div>
  );
}

export default Admin;
