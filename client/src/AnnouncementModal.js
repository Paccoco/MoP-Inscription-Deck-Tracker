import React from 'react';
import './Notifications.css';

function AnnouncementModal({ announcement, onClose }) {
  // Log the announcement data for debugging
  console.log('AnnouncementModal received:', announcement, typeof announcement);
  
  // Only show if announcement exists and is active
  if (!announcement) {
    console.log('No announcement data provided to modal');
    return null;
  }
  
  if (!announcement.active) {
    console.log('Announcement is not active:', announcement);
    return null;
  }
  
  // Links should already be parsed by the server and App.js,
  // but let's add a safety check
  let links = announcement.links || [];
  if (typeof links === 'string') {
    try {
      links = JSON.parse(links);
      console.log('Parsed links in modal:', links);
    } catch (e) {
      console.error('Error parsing announcement links in modal:', e);
      links = [];
    }
  }
  
  const handleDismiss = () => {
    // Store the dismissed announcement ID in localStorage
    const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
    if (!dismissedAnnouncements.includes(announcement.id)) {
      dismissedAnnouncements.push(announcement.id);
      localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedAnnouncements));
      console.log(`Announcement ${announcement.id} marked as dismissed in localStorage`);
    }
    
    // Close the modal
    onClose();
  };
  
  console.log('Rendering announcement modal with data:', announcement);
  
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
