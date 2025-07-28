import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DiscordWebhookConfig from './DiscordWebhookConfig';
import ExportImport from './ExportImport';
import { useAutoRefresh } from './hooks';
import AdminAnnouncement from './AdminAnnouncement';
import UserManagement from './components/UserManagement';
import DeckManagement from './components/DeckManagement';
import SecurityDashboard from './components/SecurityDashboard';

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
  const [versionCheckLoading, setVersionCheckLoading] = useState(false);
  const [versionCheckResult, setVersionCheckResult] = useState(null);

  // Summary stats
  const [notificationStats, setNotificationStats] = useState({ total: 0, unread: 0 });
  const [recentActivity, setRecentActivity] = useState([]);

  // Security Dashboard State
  const [securityScan, setSecurityScan] = useState(null);
  const [dependencyStatus, setDependencyStatus] = useState(null);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [securityError, setSecurityError] = useState('');
  const [dependencyUpdateLoading, setDependencyUpdateLoading] = useState(false);
  const [dependencyUpdateResult, setDependencyUpdateResult] = useState(null);

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

  const { sessionExpired } = useAutoRefresh(fetchAllAdminData, 30000);

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
      // Error logging handled by error boundaries
      alert(`Error pushing announcement: ${error.message}`);
    }
  };
  const handleClearAnnouncement = async () => {
    // Debug logging removed for production
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
      // Error logging handled by error boundaries
      alert(`Error clearing announcements: ${error.message}`);
    }
  };

  // Manual version check function
  const handleManualVersionCheck = async () => {
    setVersionCheckLoading(true);
    setVersionCheckResult(null);
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.post('/api/admin/version-check', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVersionCheckResult(response.data);
      
      if (response.data.updateAvailable) {
        alert(`Update Available!\n\nCurrent Version: ${response.data.localVersion}\nNew Version: ${response.data.remoteVersion}\n\nA notification has been added to your notifications panel.`);
      } else {
        alert(`Your installation is up to date!\n\nCurrent Version: ${response.data.localVersion}`);
      }
      
      // Refresh admin data to show new notifications
      fetchAllAdminData();
      
    } catch (err) {
      // Error logging handled by error boundaries
      setVersionCheckResult({ 
        success: false, 
        error: err.response?.data?.error || 'Failed to check for updates' 
      });
      alert(`Version check failed: ${err.response?.data?.error || 'Network error'}`);
    } finally {
      setVersionCheckLoading(false);
    }
  };

  // Update outdated dependencies function
  const handleUpdateDependencies = async () => {
    if (!window.confirm('This will update all outdated dependencies. This process may take a few minutes and will restart services. Continue?')) {
      return;
    }
    
    setDependencyUpdateLoading(true);
    setDependencyUpdateResult(null);
    const token = localStorage.getItem('token');
    
    try {
      const response = await axios.post('/api/admin/update-dependencies', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDependencyUpdateResult(response.data);
      
      if (response.data.success) {
        alert(`Dependencies Updated Successfully!\n\n${response.data.message}\n\n${response.data.updated_packages}\n\nRefreshing dependency status...`);
        // Refresh admin data to show updated dependency status
        fetchAllAdminData();
      } else {
        alert(`Dependency update failed: ${response.data.error}`);
      }
      
    } catch (err) {
      // Error logging handled by error boundaries
      setDependencyUpdateResult({ 
        success: false, 
        error: err.response?.data?.error || 'Failed to update dependencies',
        details: err.response?.data?.details || 'Network error'
      });
      alert(`Dependency update failed: ${err.response?.data?.error || 'Network error'}`);
    } finally {
      setDependencyUpdateLoading(false);
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
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1em' }}>
          <span style={{ fontWeight: 'bold', color: '#4caf50' }}>Server Version: {serverVersion}</span>
          <button 
            onClick={handleManualVersionCheck} 
            disabled={versionCheckLoading}
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.9em',
              backgroundColor: versionCheckLoading ? '#ccc' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: versionCheckLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {versionCheckLoading ? 'Checking...' : 'Check for Updates'}
          </button>
        </div>
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
      {versionCheckResult && (
        <div style={{ 
          padding: '1em', 
          marginBottom: '1em', 
          borderRadius: '8px',
          backgroundColor: versionCheckResult.updateAvailable ? '#fff3cd' : '#d4edda',
          border: `1px solid ${versionCheckResult.updateAvailable ? '#ffeaa7' : '#c3e6cb'}`,
          color: versionCheckResult.updateAvailable ? '#856404' : '#155724'
        }}>
          <h4 style={{ margin: '0 0 0.5em 0' }}>
            {versionCheckResult.updateAvailable ? '🚀 Update Available!' : '✅ Up to Date'}
          </h4>
          <div><strong>Current Version:</strong> {versionCheckResult.localVersion}</div>
          {versionCheckResult.remoteVersion && (
            <div><strong>Latest Version:</strong> {versionCheckResult.remoteVersion}</div>
          )}
          <div style={{ marginTop: '0.5em' }}>{versionCheckResult.message}</div>
          {versionCheckResult.updateAvailable && (
            <div style={{ marginTop: '0.5em', fontSize: '0.9em' }}>
              Check your notifications for update details, or use the automatic update system below.
            </div>
          )}
        </div>
      )}
      <UserManagement
        pending={pending}
        users={users}
        onApproveUser={approveUser}
        onRemoveUser={handleRemoveUser}
      />
      <DeckManagement
        completedDecks={completedDecks}
        selectedDeckId={selectedDeckId}
        setSelectedDeckId={setSelectedDeckId}
        disposition={disposition}
        setDisposition={setDisposition}
        salePrice={salePrice}
        setSalePrice={setSalePrice}
        recipient={recipient}
        setRecipient={setRecipient}
        payouts={payouts}
        guildCut={guildCut}
        onCompleteDeck={handleCompleteDeck}
      />
      <SecurityDashboard
        securityScan={securityScan}
        dependencyStatus={dependencyStatus}
        securityError={securityError}
        dependencyUpdateLoading={dependencyUpdateLoading}
        dependencyUpdateResult={dependencyUpdateResult}
        handleUpdateDependencies={handleUpdateDependencies}
        notificationHistory={notificationHistory}
      />
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
