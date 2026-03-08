// services/bookingService.js
// Core business logic: create bookings, post to admin group, notify clients

const bot = require('../bot/botInstance');
const repo = require('../database/bookingRepository');
const {
  buildAdminBookingMessage,
  buildUpdatedAdminMessage,
  buildBookingKeyboard,
  clientAcceptedMessage,
  clientConfirmedMessage,
  clientCancelledMessage,
} = require('../utils/messages');
const logger = require('../utils/logger');

const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID;

/**
 * Process a new booking from the website API.
 * 1. Saves to DB
 * 2. Posts to admin Telegram group
 * 3. Returns the booking object
 *
 * @param {Object} data - Booking input data
 * @returns {Object} Created booking
 */
async function processNewBooking(data) {
  // Save to database
  const booking = repo.createBooking(data);
  logger.info(`New booking created: ID=${booking.id}, name=${booking.name}, service=${booking.service}`);

  // Post to admin group
  try {
    const text = buildAdminBookingMessage(booking);
    const keyboard = buildBookingKeyboard(booking.id, booking.status);

    const msg = await bot.sendMessage(ADMIN_GROUP_ID, text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });

    // Save the message ID so we can edit it later
    repo.saveGroupMessageId(booking.id, msg.message_id);
    logger.info(`Booking #${booking.id} posted to admin group, msg_id=${msg.message_id}`);
  } catch (err) {
    logger.error(`Failed to post booking #${booking.id} to admin group: ${err.message}`);
  }

  return booking;
}

/**
 * Accept a booking (new → accepted).
 * Updates DB, edits admin group message, notifies client.
 *
 * @param {number} bookingId
 * @returns {Object} Updated booking
 */
async function acceptBooking(bookingId) {
  const booking = repo.updateBookingStatus(bookingId, 'accepted');
  if (!booking) throw new Error(`Booking #${bookingId} not found`);

  logger.info(`Booking #${bookingId} accepted`);

  await updateAdminGroupMessage(booking);
  await notifyClient(booking, clientAcceptedMessage(booking));

  return booking;
}

/**
 * Confirm a booking (accepted → confirmed).
 * Updates DB, edits admin group message, notifies client.
 *
 * @param {number} bookingId
 * @returns {Object} Updated booking
 */
async function confirmBooking(bookingId) {
  const booking = repo.updateBookingStatus(bookingId, 'confirmed');
  if (!booking) throw new Error(`Booking #${bookingId} not found`);

  logger.info(`Booking #${bookingId} confirmed`);

  await updateAdminGroupMessage(booking);
  await notifyClient(booking, clientConfirmedMessage(booking));

  return booking;
}

/**
 * Complete a booking (confirmed → completed).
 *
 * @param {number} bookingId
 * @returns {Object} Updated booking
 */
async function completeBooking(bookingId) {
  const booking = repo.updateBookingStatus(bookingId, 'completed');
  if (!booking) throw new Error(`Booking #${bookingId} not found`);
  logger.info(`Booking #${bookingId} completed`);
  await updateAdminGroupMessage(booking);
  return booking;
}

/**
 * Cancel a booking.
 *
 * @param {number} bookingId
 * @returns {Object} Updated booking
 */
async function cancelBooking(bookingId) {
  const booking = repo.updateBookingStatus(bookingId, 'cancelled');
  if (!booking) throw new Error(`Booking #${bookingId} not found`);

  logger.info(`Booking #${bookingId} cancelled`);

  await updateAdminGroupMessage(booking);
  await notifyClient(booking, clientCancelledMessage());

  return booking;
}

/**
 * Update booking fields (date, time, service) and refresh admin message.
 *
 * @param {number} bookingId
 * @param {Object} updates - { date?, time?, service?, comment? }
 * @returns {Object} Updated booking
 */
async function editBooking(bookingId, updates) {
  const booking = repo.updateBooking(bookingId, updates);
  if (!booking) throw new Error(`Booking #${bookingId} not found`);

  logger.info(`Booking #${bookingId} edited: ${JSON.stringify(updates)}`);

  await updateAdminGroupMessage(booking);

  return booking;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Edit the message in the admin group to reflect current booking state.
 * Silently ignores if no group_msg_id is stored.
 * @param {Object} booking
 */
async function updateAdminGroupMessage(booking) {
  if (!booking.group_msg_id) return;

  try {
    const text = buildUpdatedAdminMessage(booking);
    const keyboard = buildBookingKeyboard(booking.id, booking.status);

    await bot.editMessageText(text, {
      chat_id: ADMIN_GROUP_ID,
      message_id: booking.group_msg_id,
      parse_mode: 'HTML',
      reply_markup: ['completed', 'cancelled'].includes(booking.status) ? undefined : keyboard,
    });
  } catch (err) {
    // Telegram throws if message content hasn't changed — safe to ignore
    if (!err.message?.includes('message is not modified')) {
      logger.warn(`Could not edit admin group message for booking #${booking.id}: ${err.message}`);
    }
  }
}

/**
 * Send a notification to the client's Telegram if their chat ID is known.
 * @param {Object} booking
 * @param {string} text - HTML-formatted message
 */
async function notifyClient(booking, text) {
  if (!booking.tg_chat_id) {
    logger.debug(`No tg_chat_id for booking #${booking.id}, skipping client notification`);
    return;
  }

  try {
    await bot.sendMessage(booking.tg_chat_id, text, { parse_mode: 'HTML' });
    logger.info(`Client notification sent for booking #${booking.id} to chat ${booking.tg_chat_id}`);
  } catch (err) {
    logger.warn(`Failed to notify client for booking #${booking.id}: ${err.message}`);
  }
}

module.exports = {
  processNewBooking,
  acceptBooking,
  confirmBooking,
  completeBooking,
  cancelBooking,
  editBooking,
  notifyClient,
};
