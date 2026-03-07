// website-integration/bookingClient.js
// Example: how to send booking data from the website to the bot API
// Include this in your website's JavaScript bundle

const API_URL = 'https://yourdomain.com/api';  // Change to your server URL
const API_KEY = 'your-api-key-here';            // Must match API_SECRET_KEY in .env

// ─── Submit a new booking ─────────────────────────────────────────────────

/**
 * Submit a booking from the website form.
 *
 * @param {Object} formData
 * @returns {Promise<{ success: boolean, booking_id?: number, message?: string, error?: string }>}
 *
 * @example
 * const result = await submitBooking({
 *   name: 'Anna',
 *   phone: '+380XXXXXXXXX',
 *   service: 'Манікюр',
 *   date: '2026-03-09',
 *   time: '14:00',
 *   comment: 'Френч',
 *   tg_chat_id: 123456789,  // optional: client's Telegram ID
 * });
 */
async function submitBooking(formData) {
  try {
    const response = await fetch(`${API_URL}/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        service: formData.service,
        date: formData.date,       // Format: YYYY-MM-DD
        time: formData.time,       // Format: HH:MM
        comment: formData.comment || '',
        tg_username: formData.tg_username || null,  // e.g. "anna_kyiv" (without @)
        tg_chat_id: formData.tg_chat_id || null,    // Telegram user ID (integer)
      }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Booking submission failed:', err);
    return { success: false, error: 'Мережева помилка. Спробуйте ще раз.' };
  }
}

// ─── Check booking status ─────────────────────────────────────────────────

/**
 * Get the current status of a booking by ID.
 * Useful for a "check my booking" page on the website.
 *
 * @param {number} bookingId
 * @returns {Promise<Object>}
 */
async function getBookingStatus(bookingId) {
  try {
    const response = await fetch(`${API_URL}/booking/${bookingId}`, {
      headers: { 'x-api-key': API_KEY },
    });
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch booking status:', err);
    return { success: false, error: 'Мережева помилка.' };
  }
}

// ─── Example: wire up to a form ───────────────────────────────────────────

/**
 * Example integration with the booking form from the screenshot.
 * Call this in your form's submit handler.
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = form.querySelector('[type="submit"]');

  // Disable button to prevent double-submit
  submitBtn.disabled = true;
  submitBtn.textContent = 'Відправляємо...';

  const formData = {
    name: form.querySelector('[name="name"]').value,
    phone: form.querySelector('[name="phone"]').value,
    service: form.querySelector('[name="service"]').value,
    date: form.querySelector('[name="date"]').value,
    time: form.querySelector('[name="time"]').value,
    comment: form.querySelector('[name="comment"]')?.value || '',
    // Optional: get Telegram chat ID if user provided it
    tg_chat_id: form.querySelector('[name="tg_chat_id"]')?.value || null,
  };

  const result = await submitBooking(formData);

  if (result.success) {
    showSuccessMessage(result.message || 'Заявку відправлено!');
    showMessage(result.message, 'success');
    form.reset();
    // Optionally save booking ID for status checking
    localStorage.setItem('last_booking_id', result.booking_id);
  } else {
    showMessage(result.error || 'Щось пішло не так.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Записатись';
  }
}

// ─── Full fetch example (raw, no helper functions) ────────────────────────

// This is the simplest possible integration — copy-paste into your code:

/*
const payload = {
  name: "Anna",
  phone: "+380501234567",
  service: "Манікюр",
  date: "2026-03-09",
  time: "14:00",
  comment: "Френч",
};

fetch("https://yourdomain.com/api/booking", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "your-secret-api-key"
  },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showMessage("Дякуємо! " + data.message, "success");
      form.reset();
    } else {
      showMessage(data.error, "error");
    }
  })
  .catch(err => {
    console.error(err);
    showMessage("Помилка з'єднання. Спробуйте ще раз.", "error");
  });
*/

// ─── Exports (for module usage) ───────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { submitBooking, getBookingStatus, handleFormSubmit };
}
