// database/db.js
// SQLite database initialization and schema management

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || './database/bookings.db';

// Ensure database directory exists
const dbDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create and configure the database connection
const db = new Database(path.resolve(DB_PATH), {
  // Log verbose SQL in development mode
  verbose: process.env.NODE_ENV === 'development' ? (sql) => logger.debug(`SQL: ${sql}`) : null,
});

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize the database schema.
 * Creates all required tables if they don't exist.
 */
function initializeDatabase() {
  logger.info('Initializing database schema...');

  // Main bookings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      phone       TEXT    NOT NULL,
      service     TEXT    NOT NULL,
      date        TEXT    NOT NULL,   -- ISO format: YYYY-MM-DD
      time        TEXT    NOT NULL,   -- HH:MM
      comment     TEXT    DEFAULT '',
      status      TEXT    NOT NULL DEFAULT 'new',  -- new | accepted | confirmed | completed | cancelled
      tg_username TEXT    DEFAULT NULL,             -- client Telegram username (optional)
      tg_chat_id  INTEGER DEFAULT NULL,             -- client Telegram chat ID (optional)
      group_msg_id INTEGER DEFAULT NULL,            -- message ID in admin group
      contact_method TEXT DEFAULT 'phone',          -- phone | telegram
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Spam protection table: tracks request counts per phone per day
  db.exec(`
    CREATE TABLE IF NOT EXISTS spam_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      phone      TEXT NOT NULL,
      date       TEXT NOT NULL,  -- YYYY-MM-DD
      count      INTEGER NOT NULL DEFAULT 1,
      UNIQUE(phone, date)
    );
  `);

  // Reminder log: track which reminders have been sent
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders_sent (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id  INTEGER NOT NULL REFERENCES bookings(id),
      sent_at     TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(booking_id)
    );
  `);

  // Trigger to auto-update updated_at on row changes
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS bookings_update_timestamp
    AFTER UPDATE ON bookings
    BEGIN
      UPDATE bookings SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);

  // Migration: add contact_method column if not exists (for existing DBs)
  try {
    db.exec("ALTER TABLE bookings ADD COLUMN contact_method TEXT DEFAULT 'phone'");
    logger.info('Migration: added contact_method column');
  } catch (e) {
    // Column already exists — ignore
  }

  logger.info('Database initialized successfully.');
}

// Run initialization on module load
initializeDatabase();

module.exports = db;
