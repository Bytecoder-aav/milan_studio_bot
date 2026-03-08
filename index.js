// index.js
// Main entry point — Express server with Telegram webhook + API routes

require('dotenv').config();

const express = require('express');
const bot = require('./bot/botInstance');
const { registerCallbackHandlers } = require('./bot/callbackHandler');
const { registerCommandHandlers } = require('./bot/commandHandler');
const bookingRoutes = require('./api/bookingRoutes');
const { requireApiKey } = require('./api/authMiddleware');
const { startReminderScheduler } = require('./services/reminderService');
const logger = require('./utils/logger');

// ─── Validate required environment variables ──────────────────────────────

const REQUIRED_ENV = ['BOT_TOKEN', 'ADMIN_GROUP_ID', 'API_SECRET_KEY', 'WEBHOOK_URL'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);

if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// ─── Express App Setup ────────────────────────────────────────────────────

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

// CORS — allow requests from any origin (website → bot)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Parse JSON bodies
app.use(express.json());

// Trust proxy headers (needed when behind nginx/Caddy)
app.set('trust proxy', 1);

// ─── Telegram Webhook ─────────────────────────────────────────────────────

// The webhook path includes the bot token to make it hard to guess
const WEBHOOK_PATH = `/webhook/${BOT_TOKEN}`;

// Feed incoming Telegram updates to the bot
app.post(WEBHOOK_PATH, (req, res) => {
  // Optional: verify Telegram's webhook secret header
  if (WEBHOOK_SECRET) {
    const telegramSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (telegramSecret !== WEBHOOK_SECRET) {
      logger.warn(`Invalid Telegram webhook secret from ${req.ip}`);
      return res.sendStatus(403);
    }
  }

  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// ─── API Routes ───────────────────────────────────────────────────────────

// Apply API key auth middleware to all /api routes
app.use('/api', requireApiKey, bookingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled Express error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Register Bot Handlers ────────────────────────────────────────────────

registerCallbackHandlers();
registerCommandHandlers();

// ─── Start Server ─────────────────────────────────────────────────────────

async function startServer() {
  return new Promise((resolve) => {
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      resolve();
    });
  });
}

// ─── Set Telegram Webhook ─────────────────────────────────────────────────

async function setWebhook() {
  const webhookUrl = `${WEBHOOK_URL}${WEBHOOK_PATH}`;
  try {
    await bot.setWebHook(webhookUrl, {
      secret_token: WEBHOOK_SECRET || undefined,
    });
    logger.info(`✅ Telegram webhook set: ${webhookUrl}`);
  } catch (err) {
    logger.error(`❌ Failed to set webhook: ${err.message}`);
    throw err;
  }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────

async function main() {
  logger.info('=== Telegram Booking Bot starting ===');

  // Start HTTP server
  await startServer();

  // Register webhook with Telegram
  await setWebhook();

  // Start reminder scheduler
  startReminderScheduler();

  logger.info('=== Bot is ready ===');
}

main().catch((err) => {
  logger.error(`Fatal startup error: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await bot.deleteWebHook();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled promise rejection: ${reason}`);
});
