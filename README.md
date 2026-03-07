# 📅 Telegram Booking Bot

Production-ready booking management system for beauty salons and service businesses.
A website form submits bookings via API → bot posts to an admin Telegram group → admins manage bookings with inline buttons → clients receive automatic notifications and reminders.

---

## Architecture

```
Website Form
    │
    │  POST /api/booking  (x-api-key header)
    ▼
Express API Server  ──────────────────────────────────────────────
    │                                                             │
    │  Creates booking in SQLite                          Webhook │
    │                                                    (Telegram│
    ▼                                                     pushes) │
Booking Service ──► Admin Telegram Group                         │
    │                    │                                        │
    │              Inline Buttons:                                │
    │              ✅ Прийняти                                    │
    │              📅 Підтвердити                                 │
    │              🏁 Завершити                                   │
    │              ❌ Скасувати                                   │
    │              ✏️ Редагувати                                  │
    │                    │                                        │
    └────────────────────┼────────────────────────────────────────
                         │
                 Client Telegram DM
               (if tg_chat_id provided)

Reminder Cron (daily 18:00 Kyiv) ──► Client DM day before booking
```

---

## Project Structure

```
telegram-booking-bot/
├── index.js                    # Main entry point
├── package.json
├── .env.example                # Environment variables template
├── ecosystem.config.js         # PM2 production config
│
├── api/
│   ├── bookingRoutes.js        # POST /api/booking, GET /api/booking/:id
│   └── authMiddleware.js       # x-api-key verification
│
├── bot/
│   ├── botInstance.js          # Singleton bot instance (webhook mode)
│   ├── callbackHandler.js      # Inline button clicks
│   └── commandHandler.js       # /today, /week, /stats, /cancel_ID
│
├── database/
│   ├── db.js                   # SQLite init + schema
│   └── bookingRepository.js    # All DB queries
│
├── services/
│   ├── bookingService.js       # Core business logic
│   └── reminderService.js      # Cron-based reminder sender
│
├── utils/
│   ├── logger.js               # Winston structured logger
│   ├── messages.js             # All Telegram message templates
│   └── dateHelper.js           # Date formatting + validation
│
├── scripts/
│   ├── setWebhook.js           # Register webhook with Telegram
│   └── deleteWebhook.js        # Remove webhook
│
├── website-integration/
│   └── bookingClient.js        # Example fetch() calls for website
│
├── nginx/
│   └── booking-bot.conf        # Nginx reverse proxy config
│
└── logs/                       # Auto-created log directory
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- A public HTTPS URL (domain + SSL)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
nano .env
```

Fill in:

| Variable | Description | Example |
|---|---|---|
| `BOT_TOKEN` | From @BotFather | `7123456789:AAFxxx` |
| `ADMIN_GROUP_ID` | Your admin group ID | `-1001234567890` |
| `API_SECRET_KEY` | Your chosen API key | `my-super-secret` |
| `WEBHOOK_URL` | Your public HTTPS URL | `https://mysite.com` |
| `WEBHOOK_SECRET` | Webhook verification token | `random-string-here` |
| `PORT` | Server port | `3000` |

#### How to get ADMIN_GROUP_ID:
1. Add your bot to the Telegram group
2. Make it an admin
3. Send any message in the group
4. Open: `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Look for `"chat":{"id":-100XXXXXXXXXX}` — that's your group ID

---

## Running Locally (Development)

### Option A: With ngrok (recommended for testing)

```bash
# Terminal 1: Start ngrok
ngrok http 3000

# Copy the https URL, e.g. https://abc123.ngrok.io
# Add to .env: WEBHOOK_URL=https://abc123.ngrok.io

# Terminal 2: Start bot
npm run dev
```

### Option B: Without ngrok (polling mode for quick tests)

Temporarily change `botInstance.js`:
```js
// Change { webHook: true } to:
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
```
Then `npm run dev` — no webhook needed.

---

## VPS Deployment

### 1. Install Node.js and PM2

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
```

### 2. Upload project and install

```bash
# Clone or SCP your project
git clone https://github.com/you/telegram-booking-bot.git
cd telegram-booking-bot
npm install --production

# Copy and fill in environment variables
cp .env.example .env
nano .env
```

### 3. Set up Nginx

```bash
# Copy nginx config
sudo cp nginx/booking-bot.conf /etc/nginx/sites-available/booking-bot
sudo ln -s /etc/nginx/sites-available/booking-bot /etc/nginx/sites-enabled/

# Install SSL with certbot
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Start with PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow the output command to enable auto-start on reboot
```

### 5. Set the webhook

The webhook is set automatically on startup via `index.js`.
Or run manually:

```bash
npm run set-webhook
```

### 6. Verify it's working

```bash
# Check PM2 logs
pm2 logs telegram-booking-bot

# Test health endpoint
curl https://yourdomain.com/api/health

# Test booking submission
curl -X POST https://yourdomain.com/api/booking \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "name": "Anna",
    "phone": "+380501234567",
    "service": "Манікюр",
    "date": "2026-03-15",
    "time": "14:00",
    "comment": "Френч"
  }'
```

---

## Website Integration

### Basic fetch() usage

```javascript
// Replace with your server URL and API key
const API_URL = 'https://yourdomain.com/api';
const API_KEY = 'your-api-key';

// In your form submit handler:
const payload = {
  name: "Anna",
  phone: "+380501234567",
  service: "Манікюр",
  date: "2026-03-09",
  time: "14:00",
  comment: "Френч",
  tg_chat_id: null,  // optional: client's Telegram numeric ID
};

fetch(`${API_URL}/booking`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY
  },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showMessage("Дякуємо! " + data.message, "success");
      form.reset();
    } else {
      showMessage(data.error || "Помилка", "error");
    }
  });
```

See `website-integration/bookingClient.js` for a complete modular example.

---

## Admin Commands

Use these in your Telegram admin group or as private messages to the bot:

| Command | Description |
|---|---|
| `/today` | Show all bookings for today |
| `/week` | Show all bookings for this week |
| `/stats` | Show statistics (total, by status, today, this week) |
| `/booking_ID` | Show full details for a specific booking |
| `/cancel_ID` | Cancel a booking by ID |
| `/help` | Show this command list |

---

## Booking Statuses

```
new → accepted → confirmed → completed
         └──────────────────→ cancelled
```

| Status | Description |
|---|---|
| `new` | Just submitted from website |
| `accepted` | Admin clicked ✅ Прийняти |
| `confirmed` | Admin clicked 📅 Підтвердити |
| `completed` | Admin clicked 🏁 Завершити |
| `cancelled` | Admin clicked ❌ Скасувати |

---

## API Reference

### POST /api/booking
**Headers:** `x-api-key: SECRET_KEY`

**Body:**
```json
{
  "name": "string (required)",
  "phone": "string (required)",
  "service": "string (required)",
  "date": "YYYY-MM-DD (required)",
  "time": "HH:MM (required)",
  "comment": "string (optional)",
  "tg_username": "string (optional, without @)",
  "tg_chat_id": "integer (optional)"
}
```

**Response 201:**
```json
{
  "success": true,
  "booking_id": 42,
  "message": "Вашу заявку прийнято!"
}
```

### GET /api/booking/:id
**Headers:** `x-api-key: SECRET_KEY`

**Response 200:**
```json
{
  "success": true,
  "booking": {
    "id": 42,
    "name": "Anna",
    "service": "Манікюр",
    "date": "2026-03-09",
    "time": "14:00",
    "status": "confirmed",
    "created_at": "2026-03-07 10:00:00"
  }
}
```

### GET /api/health
No auth required. Returns `{"status": "ok"}`.

---

## Client Notifications (Telegram DM)

Clients receive DMs if they provide their `tg_chat_id`.

**How clients find their Telegram ID:**
1. Ask them to message [@userinfobot](https://t.me/userinfobot)
2. Or add a Telegram ID input field to your booking form
3. Or add a "Login with Telegram" widget

---

## Reminder System

The scheduler runs every day at **18:00 Kyiv time**.
It sends a reminder to clients whose booking is **tomorrow**.

Example reminder message:
```
🔔 Нагадування про запис

💅 Послуга: Манікюр
📅 Дата: 09.03.2026
🕐 Час: 14:00

Чекаємо на вас! 😊
```

---

## Security Features

- **API key** required on all endpoints via `x-api-key` header
- **Webhook secret** verifies requests are genuinely from Telegram
- **Rate limiting** — 20 req/15 min per IP on API
- **Anti-spam** — configurable max bookings per phone per day (`SPAM_LIMIT`)
- **Input validation** — all fields validated before DB insert
- **HTML escaping** — all user content sanitized before Telegram messages
- **Trust proxy** — correctly extracts real client IP behind nginx

---

## Logs

Logs are written to the `./logs/` directory:
- `combined.log` — all logs
- `error.log` — errors only
- `pm2-*.log` — PM2 process logs

Adjust verbosity via `LOG_LEVEL=debug` in `.env`.
