// utils/messages.js
const { formatDateUA } = require('./dateHelper');

function getContactMethodLabel(method) {
  if (method === 'telegram') return '📩 Написати в Telegram';
  if (method === 'phone') return '📞 Зателефонувати';
  return '📞 Зателефонувати';
}

function buildAdminBookingMessage(booking) {
  const emoji = '🆕';
  const dateFormatted = booking.date ? formatDateUA(booking.date) : '—';
  const contactLine = `📬 <b>Зв\'язок:</b> ${getContactMethodLabel(booking.contact_method)}\n`;

  return (
    `${emoji} <b>НОВА ЗАЯВКА #${booking.id}</b>\n\n` +
    `👤 <b>Клієнт:</b> ${escapeHtml(booking.name)}\n` +
    `📱 <b>Телефон:</b> ${escapeHtml(booking.phone)}\n` +
    `💅 <b>Послуга:</b> ${escapeHtml(booking.service)}\n` +
    `📅 <b>Дата (бажана):</b> ${dateFormatted}\n` +
    `🕐 <b>Час (бажаний):</b> ${booking.time || '—'}\n` +
    (booking.comment ? `💬 <b>Коментар:</b> ${escapeHtml(booking.comment)}\n` : '') +
    contactLine +
    `\n📊 <b>Статус:</b> ${getStatusLabel(booking.status)}\n` +
    `🆔 ID: <code>${booking.id}</code>`
  );
}

function buildUpdatedAdminMessage(booking) {
  const dateFormatted = booking.date ? formatDateUA(booking.date) : '—';
  const statusEmoji = getStatusEmoji(booking.status);
  const contactLine = `📬 <b>Зв\'язок:</b> ${getContactMethodLabel(booking.contact_method)}\n`;

  return (
    `${statusEmoji} <b>ЗАЯВКА #${booking.id} — ${getStatusLabel(booking.status).toUpperCase()}</b>\n\n` +
    `👤 <b>Клієнт:</b> ${escapeHtml(booking.name)}\n` +
    `📱 <b>Телефон:</b> ${escapeHtml(booking.phone)}\n` +
    `💅 <b>Послуга:</b> ${escapeHtml(booking.service)}\n` +
    `📅 <b>Дата:</b> ${dateFormatted}\n` +
    `🕐 <b>Час:</b> ${booking.time || '—'}\n` +
    (booking.comment ? `💬 <b>Коментар:</b> ${escapeHtml(booking.comment)}\n` : '') +
    contactLine +
    `\n📊 <b>Статус:</b> ${getStatusLabel(booking.status)}\n` +
    `🆔 ID: <code>${booking.id}</code>`
  );
}

// ─── Client Notifications ────────────────────────────────────────────────

function clientAcceptedMessage(booking) {
  const contactText = booking && booking.contact_method === 'telegram'
    ? 'Ми напишемо вам у Telegram найближчим часом. 📩'
    : 'Ми зателефонуємо вам у найближчий робочий час. 📞';
  return (
    `✅ <b>Ваш запис прийнято!</b>\n\n` +
    `${contactText}\n\n` +
    `Дякуємо, що обрали Milan Beauty Studio 💅`
  );
}

function clientConfirmedMessage(booking) {
  return (
    `📅 <b>Ваш запис підтверджено!</b>\n\n` +
    `💅 Послуга: ${escapeHtml(booking.service)}\n` +
    `📅 Дата: ${formatDateUA(booking.date)}\n` +
    `🕐 Час: ${booking.time}\n\n` +
    `Чекаємо на вас! До зустрічі 😊`
  );
}

function clientCancelledMessage() {
  return '❌ <b>Ваш запис скасовано.</b>\n\nЯкщо це помилка або ви хочете перезаписатись — будь ласка, зв\'яжіться з нами.';
}

function clientReminderMessage(booking) {
  return (
    `🔔 <b>Нагадування про запис</b>\n\n` +
    `Завтра у вас запис до Milan Beauty Studio!\n\n` +
    `💅 Послуга: ${escapeHtml(booking.service)}\n` +
    `📅 Дата: ${formatDateUA(booking.date)}\n` +
    `🕐 Час: ${booking.time}\n\n` +
    `Чекаємо на вас! 😊`
  );
}

// ─── Stats & List Messages ───────────────────────────────────────────────

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

function buildTodayMessage(bookings, dateStr) {
  if (bookings.length === 0) {
    return `📅 <b>Записи на ${dateStr}</b>\n\nЗаписів немає.`;
  }
  const lines = bookings.map(b =>
    `🕐 <b>${b.time}</b> — ${escapeHtml(b.name)} | ${escapeHtml(b.service)} | #${b.id} | ${getStatusLabel(b.status)}`
  );
  return `📅 <b>Записи на ${dateStr}</b>\n\n${lines.join('\n')}`;
}

function buildWeekMessage(bookings) {
  if (bookings.length === 0) {
    return `📆 <b>Записи на цей тиждень</b>\n\nЗаписів немає.`;
  }
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

function buildBookingKeyboard(bookingId, status) {
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
  }
  // confirmed — кнопки не показуємо (запис підтверджено, Завершити прибрано)

  return { inline_keyboard: buttons };
}

// ─── Helpers ─────────────────────────────────────────────────────────────

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
  clientCancelledMessage,
  clientReminderMessage,
  buildStatsMessage,
  buildTodayMessage,
  buildWeekMessage,
  buildBookingKeyboard,
  escapeHtml,
};
