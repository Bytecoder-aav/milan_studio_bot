// database/bookingRepository.js
// All database operations for bookings — clean data access layer

const db = require('./db');

/**
 * Create a new booking record.
 * @param {Object} data - Booking fields
 * @returns {Object} Created booking with generated ID
 */
function createBooking(data) {
  const stmt = db.prepare(`
    INSERT INTO bookings (name, phone, service, date, time, comment, tg_username, tg_chat_id, contact_method)
    VALUES (@name, @phone, @service, @date, @time, @comment, @tg_username, @tg_chat_id, @contact_method)
  `);

  const result = stmt.run({
    name: data.name,
    phone: data.phone,
    service: data.service,
    date: data.date,
    time: data.time,
    comment: data.comment || '',
    tg_username: data.tg_username || null,
    tg_chat_id: data.tg_chat_id || null,
    contact_method: data.contact_method || 'phone',
  });

  return getBookingById(result.lastInsertRowid);
}

/**
 * Get booking by ID.
 * @param {number} id
 * @returns {Object|null}
 */
function getBookingById(id) {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) || null;
}

/**
 * Update booking status.
 * @param {number} id
 * @param {string} status - new | accepted | confirmed | completed | cancelled
 * @returns {Object|null} Updated booking
 */
function updateBookingStatus(id, status) {
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
  return getBookingById(id);
}

/**
 * Update booking fields (date, time, service).
 * @param {number} id
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated booking
 */
function updateBooking(id, updates) {
  const allowed = ['date', 'time', 'service', 'comment', 'tg_chat_id', 'group_msg_id'];
  const fields = Object.keys(updates).filter(k => allowed.includes(k));

  if (fields.length === 0) return getBookingById(id);

  const sets = fields.map(f => `${f} = @${f}`).join(', ');
  const stmt = db.prepare(`UPDATE bookings SET ${sets} WHERE id = @id`);
  stmt.run({ ...updates, id });

  return getBookingById(id);
}

/**
 * Save the Telegram group message ID after posting.
 * @param {number} bookingId
 * @param {number} msgId
 */
function saveGroupMessageId(bookingId, msgId) {
  db.prepare('UPDATE bookings SET group_msg_id = ? WHERE id = ?').run(msgId, bookingId);
}

/**
 * Get all bookings for a specific date.
 * @param {string} date - YYYY-MM-DD
 * @returns {Array}
 */
function getBookingsByDate(date) {
  return db.prepare(`
    SELECT * FROM bookings 
    WHERE date = ? AND status NOT IN ('cancelled', 'completed')
    ORDER BY time ASC
  `).all(date);
}

/**
 * Get bookings within a date range.
 * @param {string} fromDate - YYYY-MM-DD
 * @param {string} toDate - YYYY-MM-DD
 * @returns {Array}
 */
function getBookingsByDateRange(fromDate, toDate) {
  return db.prepare(`
    SELECT * FROM bookings
    WHERE date BETWEEN ? AND ? AND status NOT IN ('cancelled', 'completed')
    ORDER BY date ASC, time ASC
  `).all(fromDate, toDate);
}

/**
 * Get bookings that need a reminder:
 * - Booking is tomorrow (relative to reminderDate)
 * - Status is accepted or confirmed
 * - No reminder has been sent yet
 * @param {string} tomorrowDate - YYYY-MM-DD (the booking date to remind about)
 * @returns {Array}
 */
function getBookingsNeedingReminder(tomorrowDate) {
  return db.prepare(`
    SELECT b.* FROM bookings b
    LEFT JOIN reminders_sent r ON r.booking_id = b.id
    WHERE b.date = ?
      AND b.status IN ('accepted', 'confirmed')
      AND r.id IS NULL
  `).all(tomorrowDate);
}

/**
 * Mark a reminder as sent for a booking.
 * @param {number} bookingId
 */
function markReminderSent(bookingId) {
  db.prepare(`
    INSERT OR IGNORE INTO reminders_sent (booking_id) VALUES (?)
  `).run(bookingId);
}

/**
 * Get admin statistics summary.
 * @returns {Object}
 */
function getStatistics() {
  const total = db.prepare("SELECT COUNT(*) as count FROM bookings").get().count;
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM bookings GROUP BY status
  `).all();
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE date = ?").get(today).count;
  const thisWeekStart = getWeekStart();
  const weekCount = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE date >= ?").get(thisWeekStart).count;

  return { total, byStatus, todayCount, weekCount };
}

/**
 * Get the ISO date string for the start of the current week (Monday).
 */
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

// ─── Spam Protection ────────────────────────────────────────────────────────

/**
 * Check if a phone number has exceeded the daily booking limit.
 * @param {string} phone
 * @param {number} limit
 * @returns {boolean} true = spam detected
 */
function isSpam(phone, limit) {
  const today = new Date().toISOString().slice(0, 10);
  const row = db.prepare('SELECT count FROM spam_log WHERE phone = ? AND date = ?').get(phone, today);
  return row ? row.count >= limit : false;
}

/**
 * Increment the spam counter for a phone number today.
 * @param {string} phone
 */
function incrementSpamCounter(phone) {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO spam_log (phone, date, count) VALUES (?, ?, 1)
    ON CONFLICT(phone, date) DO UPDATE SET count = count + 1
  `).run(phone, today);
}

module.exports = {
  createBooking,
  getBookingById,
  updateBookingStatus,
  updateBooking,
  saveGroupMessageId,
  getBookingsByDate,
  getBookingsByDateRange,
  getBookingsNeedingReminder,
  markReminderSent,
  getStatistics,
  isSpam,
  incrementSpamCounter,
};
