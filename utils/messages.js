// utils/messages.js
// All Telegram message templates in one place for easy editing

const { formatDateUA } = require('./dateHelper');

/**
 * Build the admin group message for a new booking.
 * @param {Object} booking
 * @returns {string} HTML-formatted Telegram message
 */
function buildAdminBookingMessage(booking) {
  const statusEmoji = {
    new: '🆕',
    accepted: '✅',
    confirmed: '📅',
    completed: '🏁',
    cancelled: '❌',
  };

  const emoji = statusEmoji[booking.status] || '📋';
  const dateFormatted = formatDateUA(booking.date);

  return (
    `${emoji} <b>НОВА ЗАЯВКА #${booking.id}</b>\n\n` +
    `👤 <b>Клієнт:</b> ${escapeHtml(booking.name)}\n` +
    `📱 <b>Телефон:</b> ${escapeHtml(booking.phone)}\n` +
    `💅 <b>Послуга:</b> ${escapeHtml(booking.service)}\n` +
    `📅 <b>Дата:</b> ${dateFormatted}\n` +
    `🕐 <b>Час:</b> ${booking.time}\n` +
    (booking.comment ? `💬 <b>Коментар:</b> ${escapeHtml(booking.comment)}\n` : '') +
    `\n📊 <b>Статус:</b> ${getStatusLabel(booking.status)}\n` +
    `🆔 ID: <code>${booking.id}</code>`
  );
}

/**
 * Build the updated admin group message after status change.
 * @param {Object} booking
 * @returns {string}
 */
function buildUpdatedAdminMessage(booking) {
  const dateFormatted = formatDateUA(booking.date);
  const statusEmoji = getStatusEmoji(booking.status);

  return (
    `${statusEmoji} <b>ЗАЯВКА #${booking.id} — ${getStatusLabel(booking.status).toUpperCase()}</b>\n\n` +
    `👤 <b>Клієнт:</b> ${escapeHtml(booking.name)}\n` +
    `📱 <b>Телефон:</b> ${escapeHtml(booking.phone)}\n` +
    `💅 <b>Послуга:</b> ${escapeHtml(booking.service)}\n` +
    `📅 <b>Дата:</b> ${dateFormatted}\n` +
    `🕐 <b>Час:</b> ${booking.time}\n` +
    (booking.comment ? `💬 <b>Коментар:</b> ${escapeHtml(booking.comment)}\n` : '') +
    `\n📊 <b>Статус:</b> ${getStatusLabel(booking.status)}\n` +
    `🆔 ID: <code>${booking.id}</code>`
  );
}

// ─── Client Notification Messages ─────────────────────────────────────────

function clientAcceptedMessage() {
  return '✅ <b>Ваш запис прийнято до розгляду.</b>\n\nМи зв\'яжемося з вами незабаром для підтвердження.';
}

function clientConfirmedMessage(booking) {
  return (
    `📅 <b>Ваш запис підтверджено!</b>\n\n` +
    `💅 Послуга: ${escapeHtml(booking.service)}\n` +
    `📅 Дата: ${formatDateUA(booking.date)}\n` +
    `🕐 Час: ${booking.time}\n\n` +
    `Чекаємо на вас! 😊`
  );
}

function clientCompletedMessage() {
  return '🏁 <b>Ваш запис завершено.</b>\n\nДякуємо за відвідування! Будемо раді бачити вас знову. 💅';
}

function clientCancelledMessage() {
  return '❌ <b>Ваш запис скасовано.</b>\n\nЯкщо це помилка або ви хочете перезаписатись — будь ласка, зв\'яжіться з нами.';
}

function clientReminderMessage(booking) {
  return (
    `🔔 <b>Нагадування про запис</b>\n\n` +
    `💅 Послуга: ${escapeHtml(booking.service)}\n` +
    `📅 Дата: ${formatDateUA(booking.date)}\n` +
    `🕐 Час: ${booking.time}\n\n` +
    `Чекаємо на вас! 😊`
  );
}

// ─── Admin Statistics Message ─────────────────────────────────────────────

function buildStatsMessage(stats) {
  const statusLines = stats.byStatus
    .map(s => `  • ${getStatusLabel(s.status)}: <b>${s.count}</b>`)
    .join('\n');

  return (
    `📊 <b>СТАТИСТИКА ЗАПИСІВ</b>\n\n` +
    `📋 Всього: <b>${stats.total}</b>\n` +
    `📅 Сьогодні: <b>${stats.todayCount}</b>\n` +
    `📆 Цього тижня: <b>${stats.weekCount}</b>\n\n` +
    `<b>По статусах:</b>\n${statusLines}`
  );
}

/**
 * Build the admin message for /today command.
 * @param {Array} bookings
 * @param {string} dateStr - formatted date
 * @returns {string}
 */
function buildTodayMessage(bookings, dateStr) {
  if (bookings.length === 0) {
    return `📅 <b>Записи на ${dateStr}</b>\n\nЗаписів немає.`;
  }

  const lines = bookings.map(b =>
    `🕐 <b>${b.time}</b> — ${escapeHtml(b.name)} | ${escapeHtml(b.service)} | #${b.id} | ${getStatusLabel(b.status)}`
  );

  return `📅 <b>Записи на ${dateStr}</b>\n\n${lines.join('\n')}`;
}

/**
 * Build the admin message for /week command.
 * @param {Array} bookings
 * @returns {string}
 */
function buildWeekMessage(bookings) {
  if (bookings.length === 0) {
    return `📆 <b>Записи на цей тиждень</b>\n\nЗаписів немає.`;
  }

  // Group by date
  const grouped = {};
  for (const b of bookings) {
    if (!grouped[b.date]) grouped[b.date] = [];
    grouped[b.date].push(b);
  }

  const sections = Object.entries(grouped).map(([date, bks]) => {
    const header = `📅 <b>${formatDateUA(date)}</b>`;
    const items = bks.map(b =>
      `  🕐 ${b.time} — ${escapeHtml(b.name)} | ${escapeHtml(b.service)} | #${b.id}`
    );
    return [header, ...items].join('\n');
  });

  return `📆 <b>Записи на цей тиждень</b>\n\n${sections.join('\n\n')}`;
}

// ─── Inline Keyboards ────────────────────────────────────────────────────

/**
 * Build the inline keyboard for a new booking message.
 * @param {number} bookingId
 * @returns {Object} Telegram InlineKeyboardMarkup
 */
function buildBookingKeyboard(bookingId, status) {
  // Buttons vary based on current status
  const buttons = [];

  if (status === 'new') {
    buttons.push([
      { text: '✅ Прийняти', callback_data: `accept:${bookingId}` },
      { text: '❌ Скасувати', callback_data: `cancel:${bookingId}` },
    ]);
    buttons.push([
      { text: '✏️ Редагувати', callback_data: `edit:${bookingId}` },
    ]);
  } else if (status === 'accepted') {
    buttons.push([
      { text: '📅 Підтвердити', callback_data: `confirm:${bookingId}` },
      { text: '❌ Скасувати', callback_data: `cancel:${bookingId}` },
    ]);
    buttons.push([
      { text: '✏️ Редагувати', callback_data: `edit:${bookingId}` },
    ]);
  } else if (status === 'confirmed') {
    buttons.push([
      { text: '🏁 Завершити', callback_data: `complete:${bookingId}` },
      { text: '❌ Скасувати', callback_data: `cancel:${bookingId}` },
    ]);
    buttons.push([
      { text: '✏️ Редагувати', callback_data: `edit:${bookingId}` },
    ]);
  }

  return { inline_keyboard: buttons };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function getStatusLabel(status) {
  const labels = {
    new: 'Новий',
    accepted: 'Прийнято',
    confirmed: 'Підтверджено',
    completed: 'Завершено',
    cancelled: 'Скасовано',
  };
  return labels[status] || status;
}

function getStatusEmoji(status) {
  const emojis = {
    new: '🆕',
    accepted: '✅',
    confirmed: '📅',
    completed: '🏁',
    cancelled: '❌',
  };
  return emojis[status] || '📋';
}

/** Escape HTML special chars for Telegram HTML parse mode */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {
  buildAdminBookingMessage,
  buildUpdatedAdminMessage,
  clientAcceptedMessage,
  clientConfirmedMessage,
  clientCompletedMessage,
  clientCancelledMessage,
  clientReminderMessage,
  buildStatsMessage,
  buildTodayMessage,
  buildWeekMessage,
  buildBookingKeyboard,
  escapeHtml,
};
