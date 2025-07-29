import React from 'react';
import './Notifications.css';

function AnnouncementModal({ announcement, onClose }) {
  // Only show if announcement exists and is active
  if (!announcement) {
    return null;
  }
  
  if (!announcement.active) {
    return null;
  }
  
  // Links should already be parsed by the server and App.js,
  // but let's add a safety check
  let links = announcement.links || [];
  if (typeof links === 'string') {
    try {
      links = JSON.parse(links);
    } catch (e) {
      // Error logging handled by error boundaries
      links = [];
    }
  }
  
  const handleDismiss = () => {
    // Store the dismissed announcement ID in localStorage
    const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    if (!dismissedAnnouncements.includes(announcement.id)) {
      dismissedAnnouncements.push(announcement.id);
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedAnnouncements));
    }
    
    // Close the modal
    onClose();
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content announcement-modal">
        <h2 className="announcement-title">Announcement</h2>
        <div className="announcement-message">{announcement.message}</div>
        {links && links.length > 0 && (
          <div className="announcement-links">
            {links.map((link, i) => (
              <a 
                key={i} 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="announcement-link"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
        {announcement.expiry && (
          <div className="announcement-expiry">
            Expires: {new Date(announcement.expiry).toLocaleString()}
          </div>
        )}
        <button onClick={handleDismiss} className="announcement-dismiss-button">
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default AnnouncementModal;
