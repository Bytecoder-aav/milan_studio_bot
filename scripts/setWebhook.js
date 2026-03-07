#!/usr/bin/env node
// scripts/setWebhook.js
// Manually set the Telegram webhook URL

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

if (!BOT_TOKEN || !WEBHOOK_URL) {
  console.error('❌ BOT_TOKEN and WEBHOOK_URL must be set in .env');
  process.exit(1);
}

const webhookPath = `/webhook/${BOT_TOKEN}`;
const fullUrl = `${WEBHOOK_URL}${webhookPath}`;

const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;
const body = JSON.stringify({
  url: fullUrl,
  secret_token: WEBHOOK_SECRET || undefined,
  allowed_updates: ['message', 'callback_query'],
});

console.log(`Setting webhook to: ${fullUrl}`);

const req = https.request(
  apiUrl,
  { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
  (res) => {
    let data = '';
    res.on('data', chunk => (data += chunk));
    res.on('end', () => {
      const result = JSON.parse(data);
      if (result.ok) {
        console.log('✅ Webhook set successfully!');
        console.log(`   URL: ${fullUrl}`);
      } else {
        console.error('❌ Failed:', result.description);
      }
    });
  }
);

req.on('error', err => console.error('❌ Request error:', err.message));
req.write(body);
req.end();
