// utils/dateHelper.js
// Date formatting and manipulation helpers

const { format, addDays, parseISO } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

const TIMEZONE = process.env.TIMEZONE || 'Europe/Kyiv';

/**
 * Format an ISO date string (YYYY-MM-DD) to Ukrainian DD.MM.YYYY format.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDateUA(isoDate) {
  try {
    return format(parseISO(isoDate), 'dd.MM.yyyy');
  } catch {
    return isoDate;
  }
}

/**
 * Get today's date as YYYY-MM-DD in Kyiv timezone.
 * @returns {string}
 */
function getTodayKyiv() {
  const now = new Date();
  const kyiv = toZonedTime(now, TIMEZONE);
  return format(kyiv, 'yyyy-MM-dd');
}

/**
 * Get tomorrow's date as YYYY-MM-DD in Kyiv timezone.
 * @returns {string}
 */
function getTomorrowKyiv() {
  const now = new Date();
  const kyiv = toZonedTime(now, TIMEZONE);
  const tomorrow = addDays(kyiv, 1);
  return format(tomorrow, 'yyyy-MM-dd');
}

/**
 * Get the start (Monday) and end (Sunday) of the current week as YYYY-MM-DD.
 * @returns {{ start: string, end: string }}
 */
function getCurrentWeekRange() {
  const now = new Date();
  const kyiv = toZonedTime(now, TIMEZONE);
  const day = kyiv.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = addDays(kyiv, diff);
  const sunday = addDays(monday, 6);
  return {
    start: format(monday, 'yyyy-MM-dd'),
    end: format(sunday, 'yyyy-MM-dd'),
  };
}

/**
 * Validate that a date string is in YYYY-MM-DD format and is a real date.
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Validate HH:MM time format.
 * @param {string} timeStr
 * @returns {boolean}
 */
function isValidTime(timeStr) {
  return /^\d{2}:\d{2}$/.test(timeStr);
}

module.exports = {
  formatDateUA,
  getTodayKyiv,
  getTomorrowKyiv,
  getCurrentWeekRange,
  isValidDate,
  isValidTime,
};
