import React from 'react';

function OnboardingModal({ show, onClose }) {
  if (!show) return null;
  
  return (
    <div className="onboarding-modal" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      background: 'rgba(0,0,0,0.7)', 
      zIndex: 9999 
    }}>
      <div style={{ 
        background: '#23272f', 
        color: '#c9e7c9', 
        maxWidth: 400, 
        margin: '80px auto', 
        padding: 32, 
        borderRadius: 12, 
        boxShadow: '0 2px 16px #0008' 
      }}>
        <h2>Welcome to MoP Card Tracker!</h2>
        <ul>
          <li>Track your cards and decks</li>
          <li>Request decks and get notified</li>
          <li>Export/import your collection</li>
          <li>Customize your theme</li>
          <li>Check analytics and history</li>
        </ul>
        <button onClick={onClose} style={{ marginTop: 16 }}>Got it!</button>
      </div>
    </div>
  );
}

export default OnboardingModal;
