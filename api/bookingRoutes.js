// api/bookingRoutes.js
// REST API endpoints for the website to submit bookings

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const bookingService = require('../services/bookingService');
const repo = require('../database/bookingRepository');
const { isValidDate, isValidTime } = require('../utils/dateHelper');
const logger = require('../utils/logger');

const SPAM_LIMIT = parseInt(process.env.SPAM_LIMIT || '3', 10);

// ─── Rate Limiter ────────────────────────────────────────────────────────
// Limit each IP to 20 requests per 15 minutes on API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(apiLimiter);

// ─── POST /api/booking ────────────────────────────────────────────────────

/**
 * @route   POST /api/booking
 * @desc    Create a new booking from the website
 * @access  Protected by x-api-key header
 *
 * @body {
 *   name: string,
 *   phone: string,
 *   service: string,
 *   date: string (YYYY-MM-DD),
 *   time: string (HH:MM),
 *   comment?: string,
 *   tg_username?: string,
 *   tg_chat_id?: number
 * }
 */
router.post('/booking', async (req, res) => {
  const { name, phone, service, date, time, comment, tg_username, tg_chat_id, contact_method } = req.body;

  // ── Input validation ──────────────────────────────────────────────────

  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name: required, min 2 characters');
  }

  if (!phone || typeof phone !== 'string' || !/^\+?[\d\s\-()]{7,20}$/.test(phone.trim())) {
    errors.push('phone: required, valid phone number');
  }

  if (!service || typeof service !== 'string' || service.trim().length < 2) {
    errors.push('service: required, min 2 characters');
  }

  if (!date || !isValidDate(date)) {
    errors.push('date: required, format YYYY-MM-DD');
  }

  if (!time || !isValidTime(time)) {
    errors.push('time: required, format HH:MM');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const cleanPhone = phone.trim();

  // ── Anti-spam check ───────────────────────────────────────────────────

  if (repo.isSpam(cleanPhone, SPAM_LIMIT)) {
    logger.warn(`Spam detected from phone: ${cleanPhone}`);
    return res.status(429).json({
      success: false,
      error: 'Ви вже залишили кілька заявок сьогодні. Будь ласка, спробуйте завтра.',
    });
  }

  // Increment counter before processing
  repo.incrementSpamCounter(cleanPhone);

  // ── Process booking ───────────────────────────────────────────────────

  try {
    const booking = await bookingService.processNewBooking({
      name: name.trim(),
      phone: cleanPhone,
      service: service.trim(),
      date,
      time,
      comment: (comment || '').trim(),
      tg_username: tg_username?.trim() || null,
      tg_chat_id: tg_chat_id ? parseInt(tg_chat_id, 10) : null,
      contact_method: contact_method || 'phone',
    });

    logger.info(`API: Booking created successfully ID=${booking.id}`);

    return res.status(201).json({
      success: true,
      booking_id: booking.id,
      message: 'Вашу заявку прийнято! Ми зв\'яжемося з вами найближчим часом.',
    });
  } catch (err) {
    logger.error(`API: Failed to create booking: ${err.message}`);
    return res.status(500).json({
      success: false,
      error: 'Помилка сервера. Спробуйте ще раз або зв\'яжіться з нами напряму.',
    });
  }
});

// ─── GET /api/booking/:id ─────────────────────────────────────────────────

/**
 * @route   GET /api/booking/:id
 * @desc    Get booking status by ID (for website status page)
 * @access  Protected by x-api-key header
 */
router.get('/booking/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: 'Invalid booking ID' });
  }

  const booking = repo.getBookingById(id);

  if (!booking) {
    return res.status(404).json({ success: false, error: 'Booking not found' });
  }

  // Return only safe fields to client
  return res.json({
    success: true,
    booking: {
      id: booking.id,
      name: booking.name,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      created_at: booking.created_at,
    },
  });
});

// ─── GET /api/health ──────────────────────────────────────────────────────

/**
 * @route   GET /api/health
 * @desc    Health check endpoint (no auth required)
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
