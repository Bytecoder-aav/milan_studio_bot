// ecosystem.config.js
// PM2 process manager configuration for production deployment
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'telegram-booking-bot',
      script: 'index.js',

      // Run as cluster with 1 instance (webhook mode doesn't need multiple)
      instances: 1,
      exec_mode: 'fork',

      // Auto-restart on crash
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',

      // Environment — production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logging
      log_file: './logs/pm2-combined.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
