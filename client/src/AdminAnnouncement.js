import React, { useState } from 'react';

function AdminAnnouncement({ onSet, onClear }) {
  const [message, setMessage] = useState('');
  const [expiry, setExpiry] = useState('');
  const [links, setLinks] = useState([{ label: '', url: '' }]);
  const [active, setActive] = useState(true);
  const handleLinkChange = (i, field, value) => {
    const newLinks = [...links];
    newLinks[i][field] = value;
    setLinks(newLinks);
  };
  const addLink = () => setLinks([...links, { label: '', url: '' }]);
  const removeLink = i => setLinks(links.filter((_, idx) => idx !== i));
  const handleSubmit = e => {
    e.preventDefault();
    onSet({ message, expiry, links: links.filter(l => l.label && l.url), active });
  };
  return (
    <div style={{ margin: '24px 0', padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
      <h3>Push Announcement to Users</h3>
      <form onSubmit={handleSubmit}>
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Announcement message" required style={{ width: '100%', minHeight: 60 }} />
        <div style={{ margin: '8px 0' }}>
          <label>Expiry (optional): </label>
          <input type="datetime-local" value={expiry} onChange={e => setExpiry(e.target.value)} />
        </div>
        <div style={{ margin: '8px 0' }}>
          <label>Links (optional):</label>
          {links.map((link, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <input type="text" placeholder="Label" value={link.label} onChange={e => handleLinkChange(i, 'label', e.target.value)} />
              <input type="url" placeholder="URL" value={link.url} onChange={e => handleLinkChange(i, 'url', e.target.value)} />
              <button type="button" onClick={() => removeLink(i)} disabled={links.length === 1}>Remove</button>
            </div>
          ))}
          <button type="button" onClick={addLink}>Add Link</button>
        </div>
        <div style={{ margin: '8px 0' }}>
          <label>
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active
          </label>
        </div>
        <button type="submit">Push Announcement</button>
        <button type="button" style={{ marginLeft: 8 }} onClick={onClear}>Clear Announcement</button>
      </form>
    </div>
  );
}

export default AdminAnnouncement;
