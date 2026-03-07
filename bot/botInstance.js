// bot/botInstance.js
// Singleton Telegram bot instance — used across all modules

const TelegramBot = require('node-telegram-bot-api');
const logger = require('../utils/logger');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  logger.error('BOT_TOKEN is not set in environment variables!');
  process.exit(1);
}

// Create bot in webhook mode (no polling — production ready)
const bot = new TelegramBot(BOT_TOKEN, { webHook: true });

logger.info('Telegram bot instance created (webhook mode)');

module.exports = bot;
