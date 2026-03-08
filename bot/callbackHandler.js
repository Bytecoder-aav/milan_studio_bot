// bot/callbackHandler.js
// Handles inline button clicks from admin group messages

const bot = require('./botInstance');
const bookingService = require('../services/bookingService');
const repo = require('../database/bookingRepository');
const logger = require('../utils/logger');
const { isValidDate, isValidTime } = require('../utils/dateHelper');

// Track admins currently in edit state: { chatId_bookingId: 'awaiting_date' | 'awaiting_time' | ... }
const editSessions = new Map();

/**
 * Register all callback query handlers on the bot instance.
 */
function registerCallbackHandlers() {
  bot.on('callback_query', handleCallbackQuery);
  bot.on('message', handleEditSession);

  logger.info('Callback handlers registered');
}

/**
 * Route callback_query data to the correct action handler.
 * @param {Object} query - Telegram callback query object
 */
async function handleCallbackQuery(query) {
  const { data, from, message, id: queryId } = query;

  logger.info(`Callback from ${from.id} (@${from.username}): ${data}`);

  // Parse action and booking ID from callback data format "action:bookingId"
  const [action, bookingIdStr] = data.split(':');
  const bookingId = parseInt(bookingIdStr, 10);

  if (!bookingId || isNaN(bookingId)) {
    await bot.answerCallbackQuery(queryId, { text: '❌ Невірний ID заявки' });
    return;
  }

  try {
    switch (action) {
      case 'accept':
        await handleAccept(queryId, bookingId, from);
        break;

      case 'confirm':
        await handleConfirm(queryId, bookingId, from);
        break;

      case 'cancel':
        await handleCancel(queryId, bookingId, from, message);
        break;

      case 'edit':
        await handleEditStart(queryId, bookingId, from, message);
        break;

      default:
        await bot.answerCallbackQuery(queryId, { text: '❓ Невідома команда' });
    }
  } catch (err) {
    logger.error(`Error handling callback "${data}": ${err.message}`);
    await bot.answerCallbackQuery(queryId, { text: `❌ Помилка: ${err.message}` });
  }
}

// ─── Action Handlers ─────────────────────────────────────────────────────

async function handleAccept(queryId, bookingId, admin) {
  const booking = await bookingService.acceptBooking(bookingId);
  await bot.answerCallbackQuery(queryId, {
    text: `✅ Заявку #${bookingId} прийнято`,
    show_alert: false,
  });
  logger.info(`Admin @${admin.username} accepted booking #${bookingId}`);
}

async function handleConfirm(queryId, bookingId, admin) {
  const booking = await bookingService.confirmBooking(bookingId);
  await bot.answerCallbackQuery(queryId, {
    text: `📅 Заявку #${bookingId} підтверджено. Клієнта повідомлено.`,
    show_alert: false,
  });
  logger.info(`Admin @${admin.username} confirmed booking #${bookingId}`);
}

async function handleCancel(queryId, bookingId, admin, message) {
  await bookingService.cancelBooking(bookingId);
  await bot.answerCallbackQuery(queryId, {
    text: `❌ Заявку #${bookingId} скасовано.`,
    show_alert: false,
  });
  logger.info(`Admin @${admin.username} cancelled booking #${bookingId}`);
}

// ─── Edit Flow ───────────────────────────────────────────────────────────

/**
 * Start an edit session for a booking.
 * Bot will DM the admin asking for new values.
 */
async function handleEditStart(queryId, bookingId, admin, message) {
  const booking = repo.getBookingById(bookingId);
  if (!booking) {
    await bot.answerCallbackQuery(queryId, { text: '❌ Заявку не знайдено' });
    return;
  }

  await bot.answerCallbackQuery(queryId, { text: '✏️ Починаємо редагування...' });

  // Start edit session in admin's private chat
  const sessionKey = `${admin.id}`;
  editSessions.set(sessionKey, { step: 'awaiting_field', bookingId });

  try {
    await bot.sendMessage(
      admin.id,
      `✏️ <b>Редагування заявки #${bookingId}</b>\n\n` +
      `Поточні дані:\n` +
      `📅 Дата: ${booking.date}\n` +
      `🕐 Час: ${booking.time}\n` +
      `💅 Послуга: ${booking.service}\n\n` +
      `Надішліть нові дані у форматі:\n<code>YYYY-MM-DD HH:MM Назва послуги</code>\n\n` +
      `Наприклад: <code>2026-03-10 15:30 Манікюр</code>\n\n` +
      `Або надішліть /cancel_edit для скасування.`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    // Bot may not have a private chat with the admin yet
    logger.warn(`Could not DM admin ${admin.id}: ${err.message}`);
    // Fallback: ask in the group
    await bot.sendMessage(
      message.chat.id,
      `@${admin.username}, надішліть мені особисте повідомлення, щоб почати редагування. Спочатку напишіть мені в ЛС /start`,
      { parse_mode: 'HTML' }
    );
  }
}

/**
 * Handle messages from admins who are in an active edit session.
 * @param {Object} msg - Telegram message object
 */
async function handleEditSession(msg) {
  if (!msg.text || msg.chat.type !== 'private') return;

  const sessionKey = `${msg.from.id}`;
  const session = editSessions.get(sessionKey);

  if (!session) return;

  const text = msg.text.trim();

  // Allow cancelling
  if (text === '/cancel_edit' || text === '/start') {
    editSessions.delete(sessionKey);
    await bot.sendMessage(msg.chat.id, '✅ Редагування скасовано.');
    return;
  }

  // Parse "YYYY-MM-DD HH:MM Service Name"
  const match = text.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+(.+)$/);

  if (!match) {
    await bot.sendMessage(
      msg.chat.id,
      '❌ Невірний формат. Використайте:\n<code>YYYY-MM-DD HH:MM Назва послуги</code>\n\nНаприклад: <code>2026-03-10 15:30 Манікюр</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }

  const [, date, time, service] = match;

  if (!isValidDate(date)) {
    await bot.sendMessage(msg.chat.id, '❌ Невірна дата. Використайте формат YYYY-MM-DD.');
    return;
  }

  if (!isValidTime(time)) {
    await bot.sendMessage(msg.chat.id, '❌ Невірний час. Використайте формат HH:MM.');
    return;
  }

  // Apply the edit
  try {
    await bookingService.editBooking(session.bookingId, { date, time, service: service.trim() });
    editSessions.delete(sessionKey);

    await bot.sendMessage(
      msg.chat.id,
      `✅ <b>Заявку #${session.bookingId} оновлено!</b>\n\n` +
      `📅 Нова дата: ${date}\n🕐 Новий час: ${time}\n💅 Послуга: ${service.trim()}`,
      { parse_mode: 'HTML' }
    );

    logger.info(`Admin ${msg.from.id} edited booking #${session.bookingId}: date=${date}, time=${time}, service=${service}`);
  } catch (err) {
    await bot.sendMessage(msg.chat.id, `❌ Помилка оновлення: ${err.message}`);
    logger.error(`Edit booking error: ${err.message}`);
  }
}

module.exports = { registerCallbackHandlers };
