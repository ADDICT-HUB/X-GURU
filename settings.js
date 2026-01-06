const fs = require('fs');
const path = require('path');
const { getConfig } = require('./lib/configdb');
const settings = require('./settingss');

if (fs.existsSync(path.resolve('config.env'))) {
  require('dotenv').config({ path: path.resolve('config.env') });
}

// Helper to convert "true"/"false" strings to actual boolean
function convertToBool(text, trueValue = 'true') {
  return text === trueValue;
}

module.exports = {
  // ===== BOT CORE SETTINGS =====
  SESSION_ID: settings.SESSION_ID || process.env.SESSION_ID || "",
  
  PREFIX: getConfig("PREFIX") || settings.PREFIX || ".", // Command prefix (e.g., ".", "/", "!")
  CHATBOT: getConfig("CHATBOT") || "on", // Chatbot toggle
  BOT_NAME: getConfig("BOT_NAME") || process.env.BOT_NAME || "XGURU", // Bot's display name
  MODE: getConfig("MODE") || process.env.MODE || "public", // Bot mode: public/private/group/inbox
  REPO: process.env.REPO || "https://github.com/ADDICT-HUB/X-GURU", // Bot's GitHub repo
  PAIRING_CODE: process.env.PAIRING_CODE || "false", // true or false for terminal pairing
  BAILEYS: process.env.BAILEYS || "@whiskeysockets/baileys", // WhatsApp library

  // ===== OWNER & DEVELOPER SETTINGS =====
  OWNER_NUMBER: process.env.OWNER_NUMBER || "", // No hardcoded - dynamic in index.js
  OWNER_NAME: getConfig("OWNER_NAME") || process.env.OWNER_NAME || "GuruTech", // Owner's name
  DEV: process.env.DEV || "", // Developer's contact (dynamic override recommended)
  DEVELOPER_NUMBER: process.env.DEVELOPER_NUMBER || '', // Developer's WhatsApp ID (dynamic)
  
  MENU_AUDIO_URL: getConfig("MENU_AUDIO_URL") || process.env.MENU_AUDIO_URL || 'https://files.catbox.moe/vkvci3.mp3', // Menu audio
  AUDIO_URL: getConfig("AUDIO_URL") || process.env.AUDIO_URL || 'https://files.catbox.moe/vkvci3.mp3', // global audio
  AUDIO_URL2: getConfig("AUDIO_URL2") || process.env.AUDIO_URL2 || 'https://files.catbox.moe/vkvci3.mp3', // global audio
  
  NEWSLETTER_JID: process.env.NEWSLETTER_JID || '120363421164015033@newsletter', // Newsletter JID

  // ===== AUTO-RESPONSE SETTINGS =====
  AUTO_REPLY: getConfig("AUTO_REPLY") || process.env.AUTO_REPLY || "false", // Auto-reply toggle
  AUTO_STATUS_REPLY: getConfig("AUTO_STATUS_REPLY") || process.env.AUTO_STATUS_REPLY || "false", // Reply to status updates
  AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*Just seen ur status 😆 🤖*", // Status reply message
  READ_MESSAGE: getConfig("READ_MESSAGE") || process.env.READ_MESSAGE || "true", // Mark messages as read
  REJECT_MSG: process.env.REJECT_MSG || "*📵 Calls are not allowed on this number unless you have permission. 🚫*", // Call rejection message
  ALIVE_IMG: getConfig("ALIVE_IMG") || process.env.ALIVE_IMG || "https://files.catbox.moe/atpgij.jpg", // Alive image
  LIVE_MSG: process.env.LIVE_MSG || "> ʙᴏᴛ ɪs sᴘᴀʀᴋɪɴɢ ᴀᴄᴛɪᴠᴇ ᴀɴᴅ ᴀʟɪᴠᴇ\n\n\n> ɢɪᴛʜᴜʙ :* github.com/ADDICT-HUB/X-GURU", // Alive message

  // ===== REACTION & STICKER SETTINGS =====
  AUTO_REACT: getConfig("AUTO_REACT") || process.env.AUTO_REACT || "true", // Auto-react to messages
  OWNER_REACT: getConfig("OWNER_REACT") || process.env.OWNER_REACT || "true", // Owner-specific reactions
  CUSTOM_REACT: getConfig("CUSTOM_REACT") || process.env.CUSTOM_REACT || "true", // Custom emoji reactions
  CUSTOM_REACT_EMOJIS: getConfig("CUSTOM_REACT_EMOJIS") || process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍", // Custom reaction emojis
  STICKER_NAME: process.env.STICKER_NAME || "XGURU", // Sticker pack name
  AUTO_STICKER: getConfig("AUTO_STICKER") || process.env.AUTO_STICKER || "true", // Auto-send stickers

  // ===== MEDIA & AUTOMATION =====
  AUTO_RECORDING: getConfig("AUTO_RECORDING") || process.env.AUTO_RECORDING || "true", // Auto-record voice notes
  AUTO_TYPING: getConfig("AUTO_TYPING") || process.env.AUTO_TYPING || "true", // Show typing indicator
  MENTION_REPLY: getConfig("MENTION_REPLY") || process.env.MENTION_REPLY || "true", // Reply to mentions
  MENU_IMAGE_URL: getConfig("MENU_IMAGE_URL") || process.env.MENU_IMAGE_URL || "https://files.catbox.moe/atpgij.jpg", // Menu image

  // ===== SECURITY & ANTI-FEATURES =====
  ANTI_DELETE: getConfig("ANTI_DELETE") || process.env.ANTI_DELETE || "true", // Prevent message deletion
  ANTI_CALL: getConfig("ANTI_CALL") || process.env.ANTI_CALL || "true", // Block incoming calls
  ANTI_BAD_WORD: getConfig("ANTI_BAD_WORD") || process.env.ANTI_BAD_WORD || "false", // Block bad words
  ANTI_LINK: getConfig("ANTI_LINK") || process.env.ANTI_LINK || "true", // Block links in groups
  ANTI_VV: getConfig("ANTI_VV") || process.env.ANTI_VV || "true", // Block view-once messages
  DELETE_LINKS: getConfig("DELETE_LINKS") || process.env.DELETE_LINKS || "false", // Auto-delete links
  ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "inbox", // Log deleted messages
  ANTI_BOT: getConfig("ANTI_BOT") || process.env.ANTI_BOT || "true", // Block other bots
  PM_BLOCKER: getConfig("PM_BLOCKER") || process.env.PM_BLOCKER || "true", // Block private messages

  // ===== ANTI-SPAM & SECURITY ENHANCEMENTS =====
  ANTI_FLOOD: getConfig("ANTI_FLOOD") || process.env.ANTI_FLOOD || "true", // Block message flooding
  FLOOD_LIMIT: getConfig("FLOOD_LIMIT") || process.env.FLOOD_LIMIT || "7", // Max messages allowed in 10 seconds
  ANTI_SPAM_LINKS: getConfig("ANTI_SPAM_LINKS") || process.env.ANTI_SPAM_LINKS || "true", // Block known spam/shortened links (t.me, bit.ly, etc.)
  ANTI_FOREIGNER: getConfig("ANTI_FOREIGNER") || process.env.ANTI_FOREIGNER || "false", // Restrict non-allowed country codes
  ALLOWED_COUNTRY_CODES: process.env.ALLOWED_COUNTRY_CODES || "254,1,91", // Comma-separated country codes (e.g., Kenya, USA, India)
  AUTO_MUTE_SPAMMER: getConfig("AUTO_MUTE_SPAMMER") || process.env.AUTO_MUTE_SPAMMER || "true", // Auto-kick/remove spammers
  BAD_WORDS: process.env.BAD_WORDS || "fuck,shit,bitch,nigga,porn,sex,asshole,mf,motherfucker,dick,cock,pussy", // Comma-separated bad words list

  // ===== BOT BEHAVIOR & APPEARANCE =====
  DESCRIPTION: process.env.DESCRIPTION || "*ᴍᴀᴅᴇ ʙʏ ɢᴜʀᴜᴛᴇᴄʜ*", // Bot footer
  PUBLIC_MODE: getConfig("PUBLIC_MODE") || process.env.PUBLIC_MODE || "true", // Allow public commands
  ALWAYS_ONLINE: getConfig("ALWAYS_ONLINE") || process.env.ALWAYS_ONLINE || "false", // Show bot as always online
  AUTO_STATUS_REACT: getConfig("AUTO_STATUS_REACT") || process.env.AUTO_STATUS_REACT || "true", // React to status updates
  AUTO_STATUS_SEEN: getConfig("AUTO_STATUS_SEEN") || process.env.AUTO_STATUS_SEEN || "true", // View status updates
  AUTO_BIO: getConfig("AUTO_BIO") || process.env.AUTO_BIO || "false", // Auto-update bio
  WELCOME: getConfig("WELCOME") || process.env.WELCOME || "false", // Welcome messages
  GOODBYE: getConfig("GOODBYE") || process.env.GOODBYE || "false", // Goodbye messages
  ADMIN_ACTION: getConfig("ADMIN_ACTION") || process.env.ADMIN_ACTION || "false", // Admin event handling
  version: process.env.version || "2.0.0", // Bot version
  TIMEZONE: settings.TIMEZONE || process.env.TIMEZONE || "Africa/Harare", // Bot timezone

  // ===== CATEGORY-SPECIFIC IMAGE URLs =====
  MENU_IMAGES: {
    '1': process.env.DOWNLOAD_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg", // Download Menu
    '2': process.env.GROUP_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg",   // Group Menu
    '3': process.env.FUN_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg",  // Fun Menu
    '4': process.env.OWNER_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg",   // Owner Menu
    '5': process.env.AI_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg",         // AI Menu
    '6': process.env.ANIME_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg",   // Anime Menu
    '7': process.env.CONVERT_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg", // Convert Menu
    '8': process.env.OTHER_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg",   // Other Menu
    '9': process.env.REACTION_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg", // Reaction Menu
    '10': process.env.MAIN_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg",    // Main Menu
    '11': process.env.LOGO_MAKER_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg", // Logo Maker Menu
    '12': process.env.SETTINGS_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg", // Settings Menu
    '13': process.env.AUDIO_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg",  // Audio Menu
    '14': process.env.PRIVACY_MENU_IMAGE || "https://files.catbox.moe/atpgij.jpg" // Privacy Menu
  }
};
