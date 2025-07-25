// Send Gotify notification from CI or local script
require('dotenv').config();
const https = require('https');
const url = require('url');

const GOTIFY_SERVER = process.env.GOTIFY_SERVER;
const GOTIFY_TOKEN = process.env.GOTIFY_TOKEN;
const SEVERITY = process.argv[2] || 'Unknown';
const RISK = process.argv[3] || 'Security vulnerability detected!';
const CONTEXT = process.argv[4] || '';

if (!GOTIFY_SERVER || !GOTIFY_TOKEN) {
  console.error('Missing GOTIFY_SERVER or GOTIFY_TOKEN in .env');
  process.exit(1);
}

const gotifyUrl = `${GOTIFY_SERVER}/message?token=${GOTIFY_TOKEN}`;
const postData = JSON.stringify({
  title: `Security Alert (${SEVERITY})`,
  message: `Severity: ${SEVERITY}\nRisk: ${RISK}${CONTEXT ? `\nContext: ${CONTEXT}` : ''}`,
  priority: SEVERITY === 'Critical' ? 10 : SEVERITY === 'High' ? 7 : 5
});

const options = url.parse(gotifyUrl);
options.method = 'POST';
options.headers = {
  'Content-Type': 'application/json',
  'Content-Length': Buffer.byteLength(postData)
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Gotify notification sent.');
    } else {
      console.error('Gotify error:', res.statusCode, data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(postData);
req.end();
