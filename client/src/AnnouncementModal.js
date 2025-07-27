import React, { useEffect, useState } from 'react';

function AnnouncementModal({ announcement, onClose }) {
  if (!announcement || !announcement.active) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Announcement</h2>
        <div style={{ marginBottom: 16 }}>{announcement.message}</div>
        {announcement.links && announcement.links.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {announcement.links.map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: 8 }}>
                {link.label}
              </a>
            ))}
          </div>
        )}
        {announcement.expiry && (
          <div style={{ fontSize: '0.9em', color: '#888' }}>
            Expires: {new Date(announcement.expiry).toLocaleString()}
          </div>
        )}
        <button onClick={onClose} style={{ marginTop: 24 }}>Dismiss</button>
      </div>
    </div>
  );
}

export default AnnouncementModal;
