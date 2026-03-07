// bot/commandHandler.js
// Admin Telegram commands: /today, /week, /stats, /cancel, /help

const bot = require('./botInstance');
const repo = require('../database/bookingRepository');
const bookingService = require('../services/bookingService');
const { reminderService } = require('../services/reminderService');
const {
  buildTodayMessage,
  buildWeekMessage,
  buildStatsMessage,
} = require('../utils/messages');
const {
  getTodayKyiv,
  getCurrentWeekRange,
  formatDateUA,
} = require('../utils/dateHelper');
const logger = require('../utils/logger');

const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID;

/**
 * Register all bot command handlers.
 */
function registerCommandHandlers() {
  bot.onText(/\/today/, handleToday);
  bot.onText(/\/week/, handleWeek);
  bot.onText(/\/stats/, handleStats);
  bot.onText(/\/cancel_(\d+)/, handleCancelById);
  bot.onText(/\/booking_(\d+)/, handleBookingInfo);
  bot.onText(/\/start/, handleStart);
  bot.onText(/\/help/, handleHelp);

  logger.info('Command handlers registered');
}

// ─── /today — Show today's bookings ──────────────────────────────────────

async function handleToday(msg) {
  if (!isAdminContext(msg)) return;

  const today = getTodayKyiv();
  const bookings = repo.getBookingsByDate(today);
  const text = buildTodayMessage(bookings, formatDateUA(today));

  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
  logger.info(`/today command used by ${msg.from.id} — ${bookings.length} bookings`);
}

// ─── /week — Show this week's bookings ───────────────────────────────────

async function handleWeek(msg) {
  if (!isAdminContext(msg)) return;

  const { start, end } = getCurrentWeekRange();
  const bookings = repo.getBookingsByDateRange(start, end);
  const text = buildWeekMessage(bookings);

  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
  logger.info(`/week command used by ${msg.from.id} — ${bookings.length} bookings`);
}

// ─── /stats — Admin statistics ────────────────────────────────────────────

async function handleStats(msg) {
  if (!isAdminContext(msg)) return;

  const stats = repo.getStatistics();
  const text = buildStatsMessage(stats);

  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
  logger.info(`/stats command used by ${msg.from.id}`);
}

// ─── /cancel_ID — Cancel a booking by ID ─────────────────────────────────

async function handleCancelById(msg, match) {
  if (!isAdminContext(msg)) return;

  const bookingId = parseInt(match[1], 10);
  const booking = repo.getBookingById(bookingId);

  if (!booking) {
    await bot.sendMessage(msg.chat.id, `❌ Заявку #${bookingId} не знайдено.`);
    return;
  }

  if (['completed', 'cancelled'].includes(booking.status)) {
    await bot.sendMessage(msg.chat.id, `⚠️ Заявка #${bookingId} вже має статус "${booking.status}".`);
    return;
  }

  await bookingService.cancelBooking(bookingId);
  await bot.sendMessage(msg.chat.id, `✅ Заявку #${bookingId} скасовано.`);
  logger.info(`Admin ${msg.from.id} cancelled booking #${bookingId} via command`);
}

// ─── /booking_ID — View booking details ───────────────────────────────────

async function handleBookingInfo(msg, match) {
  if (!isAdminContext(msg)) return;

  const bookingId = parseInt(match[1], 10);
  const booking = repo.getBookingById(bookingId);

  if (!booking) {
    await bot.sendMessage(msg.chat.id, `❌ Заявку #${bookingId} не знайдено.`);
    return;
  }

  const text =
    `📋 <b>Заявка #${booking.id}</b>\n\n` +
    `👤 Ім'я: ${booking.name}\n` +
    `📱 Телефон: ${booking.phone}\n` +
    `💅 Послуга: ${booking.service}\n` +
    `📅 Дата: ${formatDateUA(booking.date)}\n` +
    `🕐 Час: ${booking.time}\n` +
    `💬 Коментар: ${booking.comment || '—'}\n` +
    `📊 Статус: ${booking.status}\n` +
    `🆔 Telegram ID: ${booking.tg_chat_id || '—'}\n` +
    `📝 Створено: ${booking.created_at}`;

  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
}

// ─── /start — Private chat welcome ────────────────────────────────────────

async function handleStart(msg) {
  if (msg.chat.type !== 'private') return;

  await bot.sendMessage(
    msg.chat.id,
    `👋 <b>Привіт!</b>\n\nЯ бот для управління записами.\n\n` +
    `Щоб отримувати повідомлення про статус вашого запису, повідомте адміністратору ваш Telegram ID:\n` +
    `<code>${msg.from.id}</code>`,
    { parse_mode: 'HTML' }
  );
}

// ─── /help — Admin help text ──────────────────────────────────────────────

async function handleHelp(msg) {
  if (!isAdminContext(msg)) return;

  const text =
    `📖 <b>Команди адміністратора</b>\n\n` +
    `/today — Записи на сьогодні\n` +
    `/week — Записи на цей тиждень\n` +
    `/stats — Загальна статистика\n` +
    `/booking_ID — Інфо про заявку\n` +
    `/cancel_ID — Скасувати заявку\n` +
    `/help — Ця довідка`;

  await bot.sendMessage(msg.chat.id, text, { parse_mode: 'HTML' });
}

// ─── Helper ───────────────────────────────────────────────────────────────

/**
 * Only allow admin commands in the admin group or in private chats.
 * @param {Object} msg
 * @returns {boolean}
 */
function isAdminContext(msg) {
  const isGroup = msg.chat.id.toString() === ADMIN_GROUP_ID?.toString();
  const isPrivate = msg.chat.type === 'private';
  return isGroup || isPrivate;
}

module.exports = { registerCommandHandlers };
