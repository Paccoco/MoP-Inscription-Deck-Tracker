import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DiscordWebhookConfig() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Fetch current webhook URL
    axios.get('/api/discord/webhook', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => setWebhookUrl(res.data.webhookUrl || ''))
      .catch(() => setWebhookUrl(''));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/discord/webhook', { webhookUrl }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStatus('Webhook URL saved!');
    } catch {
      setStatus('Failed to save webhook URL.');
    }
  };

  return (
    <div style={{ marginBottom: '2em', background: '#23272f', padding: '1em', borderRadius: '8px' }}>
      <h4>Configure Discord Webhook <span title="Paste your Discord webhook URL here to receive automated notifications in your guild's Discord channel.">🛈</span></h4>
      <form onSubmit={handleSave}>
        <input
          type="url"
          value={webhookUrl}
          onChange={e => setWebhookUrl(e.target.value)}
          placeholder="Paste Discord webhook URL here"
          style={{ width: '80%' }}
          required
        />
        <button type="submit" style={{ marginLeft: '1em' }}>Save</button>
      </form>
      {status && <div style={{ marginTop: '0.5em', color: status.includes('Failed') ? 'red' : '#f5ba42' }}>{status}</div>}
      <div style={{ fontSize: '0.95em', marginTop: '0.5em', color: '#c9e7c9' }}>
        <strong>Tip:</strong> Create a webhook in your Discord channel settings, then paste the URL here. The app will send notifications for deck completions, sales, and requests.
        <span title="Discord webhooks allow automated messages to be sent to your channel. Learn more at https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks">🛈</span>
      </div>
    </div>
  );
}

export default DiscordWebhookConfig;
