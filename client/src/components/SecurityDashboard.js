import React from 'react';

function SecurityDashboard({ 
  securityScan, 
  dependencyStatus, 
  securityError, 
  dependencyUpdateLoading, 
  dependencyUpdateResult, 
  handleUpdateDependencies,
  notificationHistory
}) {
  return (
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
            <a href="https://github.com/Paccoco/MoP-Inscription-Deck-Tracker/actions?query=workflow%3A%22Security+%26+Dependency+Audit%22" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 16 }}>View CI Logs</a>
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
            {dependencyStatus.outdated > 0 && (
              <div style={{ marginTop: '1em' }}>
                <button 
                  onClick={handleUpdateDependencies} 
                  disabled={dependencyUpdateLoading}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: dependencyUpdateLoading ? '#ccc' : '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: dependencyUpdateLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {dependencyUpdateLoading ? 'Updating...' : 'Update Dependencies'}
                </button>
                {dependencyUpdateResult && (
                  <div style={{ marginTop: '1em', padding: '1em', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <strong>Update Result:</strong> {dependencyUpdateResult.message}
                  </div>
                )}
              </div>
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
            {notificationHistory && notificationHistory.length === 0 ? (
              <tr><td colSpan={3}>No notifications found.</td></tr>
            ) : notificationHistory && notificationHistory.map((n, i) => (
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
  );
}

export default SecurityDashboard;
