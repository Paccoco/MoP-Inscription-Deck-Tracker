import React, { useState } from 'react';

function AdminAnnouncement({ onSet, onClear }) {
  const [message, setMessage] = useState('');
  const [expiryOption, setExpiryOption] = useState('');
  const [links, setLinks] = useState([{ label: '', url: '' }]);
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // Expiry options
  const expiryOptions = [
    { value: '', label: 'No expiry (permanent)' },
    { value: '1h', label: '1 hour' },
    { value: '1d', label: '1 day' },
    { value: '1w', label: '1 week' }
  ];

  const handleLinkChange = (i, field, value) => {
    const newLinks = [...links];
    newLinks[i][field] = value;
    setLinks(newLinks);
  };

  const addLink = () => setLinks([...links, { label: '', url: '' }]);
  
  const removeLink = i => setLinks(links.filter((_, idx) => idx !== i));
  
  const validateForm = () => {
    const newErrors = {};
    if (!message.trim()) {
      newErrors.message = 'Announcement message is required';
    }
    
    // Validate links if they are partially filled
    links.forEach((link, index) => {
      if ((link.label && !link.url) || (!link.label && link.url)) {
        newErrors[`link-${index}`] = 'Both label and URL are required for a link';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate expiry date based on selected option
  const calculateExpiryDate = (option) => {
    if (!option) return '';
    
    const now = new Date();
    
    switch(option) {
      case '1h':
        now.setHours(now.getHours() + 1);
        break;
      case '1d':
        now.setDate(now.getDate() + 1);
        break;
      case '1w':
        now.setDate(now.getDate() + 7);
        break;
      default:
        return '';
    }
    
    return now.toISOString();
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (validateForm()) {
      // Calculate actual expiry date from selected option
      const expiryDate = calculateExpiryDate(expiryOption);
      
      onSet({ 
        message, 
        expiry: expiryDate, 
        links: links.filter(l => l.label && l.url), 
        active 
      });
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="admin-card announcement-form-card">
      <h2 className="section-header">Push Announcement to Users</h2>
      
      {Object.keys(errors).length > 0 && (
        <div className="validation-errors">
          {Object.values(errors).map((error, index) => (
            <p key={index} className="error-message">{error}</p>
          ))}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="announcement-form">
        <div className="form-group">
          <label htmlFor="announcement-message">
            Announcement Message <span className="required-field">*</span>
          </label>
          <textarea 
            id="announcement-message"
            value={message} 
            onChange={e => setMessage(e.target.value)} 
            placeholder="Enter your announcement message here" 
            required 
            className={errors.message ? 'error-input' : ''}
            aria-required="true"
            aria-invalid={errors.message ? 'true' : 'false'}
          />
          {errors.message && <span className="error-text">{errors.message}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="announcement-expiry" className="with-tooltip">
            Expiry Time
            <span className="tooltip-icon" title="Set when this announcement will automatically expire">?</span>
          </label>
          <select
            id="announcement-expiry"
            value={expiryOption}
            onChange={e => setExpiryOption(e.target.value)}
            aria-label="Announcement expiry time"
            className="expiry-select"
          >
            {expiryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small className="helper-text">Select how long this announcement should be visible</small>
        </div>
        
        <div className="form-group">
          <label className="with-tooltip">
            Announcement Links
            <span className="tooltip-icon" title="Add clickable links to your announcement">?</span>
          </label>
          
          <div className="links-container">
            {links.map((link, i) => (
              <div key={i} className={`link-row ${errors[`link-${i}`] ? 'error-row' : ''}`}>
                <input 
                  type="text" 
                  placeholder="Link Label" 
                  value={link.label} 
                  onChange={e => handleLinkChange(i, 'label', e.target.value)} 
                  aria-label={`Link ${i+1} label`}
                />
                <input 
                  type="url" 
                  placeholder="https://example.com" 
                  value={link.url} 
                  onChange={e => handleLinkChange(i, 'url', e.target.value)} 
                  aria-label={`Link ${i+1} URL`}
                />
                <button 
                  type="button" 
                  onClick={() => removeLink(i)} 
                  disabled={links.length === 1}
                  className="secondary-button small-button"
                  aria-label="Remove link"
                >
                  Remove
                </button>
                {errors[`link-${i}`] && <span className="error-text">{errors[`link-${i}`]}</span>}
              </div>
            ))}
          </div>
          
          <button 
            type="button" 
            onClick={addLink} 
            className="secondary-button small-button add-link-button"
            aria-label="Add another link"
          >
            + Add Link
          </button>
        </div>
        
        <div className="form-group checkbox-group">
          <label>
            <input 
              type="checkbox" 
              checked={active} 
              onChange={e => setActive(e.target.checked)} 
              aria-label="Make announcement active"
            /> 
            Active
          </label>
          <small className="helper-text">Uncheck to create but not display the announcement</small>
        </div>

        <div className="preview-toggle">
          <button 
            type="button" 
            onClick={togglePreview} 
            className="secondary-button"
            aria-label="Toggle announcement preview"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
        
        {showPreview && message && (
          <div className="announcement-preview">
            <h3>Preview</h3>
            <div className="notification-item important">
              <div className="notification-content">
                <p>{message}</p>
                {links.some(l => l.label && l.url) && (
                  <div className="notification-links">
                    {links.filter(l => l.label && l.url).map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="action-buttons">
          <button 
            type="button" 
            onClick={onClear} 
            className="secondary-button"
            aria-label="Clear announcement form"
          >
            Clear Announcement
          </button>
          <button 
            type="submit" 
            className="primary-button"
            aria-label="Push announcement to users"
          >
            Push Announcement
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminAnnouncement;
