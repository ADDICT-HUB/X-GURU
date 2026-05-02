# XGURU - Advanced WhatsApp Bot

## Overview
XGURU is an advanced WhatsApp bot built with Node.js using the Baileys (WhatsApp Web) multi-device auth library. It provides a rich command system loaded dynamically from a `plugins/` directory.

## Tech Stack
- **Runtime**: Node.js 18.x
- **WhatsApp Library**: `@whiskeysockets/baileys` v6.7.9 (CommonJS-compatible)
- **Web Server**: Express (serves static UI at port 5000)
- **Database**: Sequelize with PostgreSQL (via Replit DB) or SQLite fallback
- **Config DB**: better-sqlite3 (for bot settings)
- **Media**: FFmpeg + fluent-ffmpeg, sharp, wa-sticker-formatter

## Architecture
- `index.js` - Main entry point: WhatsApp connection, plugin loader, command router
- `settings.js` / `settingss.js` - Configuration (env vars + configdb)
- `lib/` - Shared utilities (database, functions, configdb, etc.)
- `lib/marisel.html` - Web UI served by Express
- `plugins/` - Command modules loaded dynamically at startup
- `data/` - Higher-level data modules (anti-delete, store, etc.)
- `autos/` - Automation configs (autoreply, autosticker)
- `sessions/` - WhatsApp auth credentials (creds.json)

## Running the App
The workflow command is: `PORT=5000 node index.js`

On startup:
1. Express starts on port 5000 (web UI)
2. After 4s delay, connects to WhatsApp and shows QR code in terminal

## Environment Variables
- `SESSION_ID` - WhatsApp session ID (for restoring saved sessions)
- `DATABASE_URL` - PostgreSQL connection (auto-set by Replit)
- `PORT` - Server port (set to 5000 by workflow)
- Many optional bot behavior settings (see settings.js)

## Notes
- Baileys downgraded from v7.0.0-rc.9 (ESM-only) to v6.7.9 (CJS) for compatibility
- `better-sqlite3` and `sharp` native bindings rebuilt for Replit environment
- `lib/database.js` modified to remove native SSL requirement for Replit PostgreSQL
