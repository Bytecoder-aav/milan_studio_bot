// api/authMiddleware.js
// API key verification middleware for protected endpoints

const logger = require('../utils/logger');

const API_SECRET_KEY = process.env.API_SECRET_KEY;

/**
 * Middleware that verifies the x-api-key header on incoming requests.
 * Rejects with 401 if key is missing or incorrect.
 */
function requireApiKey(req, res, next) {
  // Skip auth for health check
  if (req.path === '/health') return next();

  const providedKey = req.headers['x-api-key'];

  if (!providedKey) {
    logger.warn(`API request without key from ${req.ip} — ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: 'API key required. Set x-api-key header.' });
  }

  if (providedKey !== API_SECRET_KEY) {
    logger.warn(`Invalid API key from ${req.ip} — ${req.method} ${req.originalUrl}`);
    return res.status(403).json({ error: 'Invalid API key.' });
  }

  next();
}

module.exports = { requireApiKey };
