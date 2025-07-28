import React from 'react';

function VersionManagement({ versionInfo, changelogGenerated, changelogContent, onGenerateChangelog }) {
  return (
    <div className="version-management" style={{ margin: '2em 0', padding: '1em', border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Version Management</h2>
      
      <div>
        <h3>Version Information</h3>
        {versionInfo ? (
          <div>
            <div><strong>Client Version:</strong> {versionInfo.client}</div>
            <div><strong>Server Version:</strong> {versionInfo.server}</div>
            <div><strong>Database Version:</strong> {versionInfo.database}</div>
            <div><strong>Node.js Version:</strong> {versionInfo.node}</div>
            <div><strong>Environment:</strong> {versionInfo.environment}</div>
            <div><strong>Uptime:</strong> {versionInfo.uptime}</div>
          </div>
        ) : <div>Loading version info...</div>}
      </div>
      
      <div>
        <h3>Changelog Management</h3>
        <button 
          onClick={onGenerateChangelog}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#2196f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Generate Changelog
        </button>
        
        {changelogGenerated && (
          <div style={{ marginTop: '1em' }}>
            <h4>Generated Changelog:</h4>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '1em', 
              borderRadius: '4px', 
              overflow: 'auto', 
              maxHeight: '400px',
              whiteSpace: 'pre-wrap'
            }}>
              {changelogContent}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default VersionManagement;
