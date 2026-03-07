// services/reminderService.js
// Cron-based reminder system — sends booking reminders the day before at 18:00 Kyiv time

const cron = require('node-cron');
const bot = require('../bot/botInstance');
const repo = require('../database/bookingRepository');
const { clientReminderMessage } = require('../utils/messages');
const { getTomorrowKyiv } = require('../utils/dateHelper');
const logger = require('../utils/logger');

const TIMEZONE = process.env.TIMEZONE || 'Europe/Kyiv';

/**
 * Initialize and start the reminder cron job.
 * Runs every day at 18:00 Kyiv time.
 * Sends a reminder to clients whose booking is tomorrow.
 */
function startReminderScheduler() {
  // Cron expression: minute=0, hour=18, every day
  // node-cron supports timezone natively
  const job = cron.schedule(
    '0 18 * * *',
    async () => {
      logger.info('⏰ Reminder cron job triggered');
      await sendReminders();
    },
    {
      timezone: TIMEZONE,
      scheduled: true,
    }
  );

  logger.info(`📅 Reminder scheduler started (runs daily at 18:00 ${TIMEZONE})`);
  return job;
}

/**
 * Find all bookings for tomorrow that haven't received a reminder yet
 * and send Telegram messages to clients.
 */
async function sendReminders() {
  const tomorrow = getTomorrowKyiv();
  logger.info(`Checking reminders for date: ${tomorrow}`);

  const bookings = repo.getBookingsNeedingReminder(tomorrow);
  logger.info(`Found ${bookings.length} booking(s) needing reminders`);

  for (const booking of bookings) {
    await sendSingleReminder(booking);
  }
}

/**
 * Send a single reminder for a booking.
 * Marks as sent regardless of success to prevent duplicate attempts.
 * @param {Object} booking
 */
async function sendSingleReminder(booking) {
  // Mark immediately to prevent duplicate sends on retry
  repo.markReminderSent(booking.id);

  if (!booking.tg_chat_id) {
    logger.debug(`Booking #${booking.id}: no tg_chat_id, reminder skipped`);
    return;
  }

  try {
    const text = clientReminderMessage(booking);
    await bot.sendMessage(booking.tg_chat_id, text, { parse_mode: 'HTML' });
    logger.info(`✅ Reminder sent for booking #${booking.id} to chat ${booking.tg_chat_id}`);
  } catch (err) {
    logger.error(`❌ Failed to send reminder for booking #${booking.id}: ${err.message}`);
  }
}

/**
 * Manually trigger reminders (useful for testing).
 * Can be called from admin commands.
 */
async function triggerRemindersNow() {
  logger.info('Manual reminder trigger requested');
  await sendReminders();
}

module.exports = {
  startReminderScheduler,
  triggerRemindersNow,
};
