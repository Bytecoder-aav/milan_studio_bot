#!/usr/bin/env node
// scripts/deleteWebhook.js
// Remove the Telegram webhook (use before switching to polling mode)

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;

const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=true`;

console.log('Deleting webhook...');

https.get(apiUrl, (res) => {
  let data = '';
  res.on('data', chunk => (data += chunk));
  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.ok) {
      console.log('✅ Webhook deleted successfully!');
    } else {
      console.error('❌ Failed:', result.description);
    }
  });
}).on('error', err => console.error('❌ Error:', err.message));
