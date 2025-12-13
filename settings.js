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

// Ensure SESSION_ID is provided
if (!process.env.SESSION_ID && !settings.SESSION_ID) {
  console.error("❌ SESSION_ID missing! Please set a valid Base64 session in your environment.");
  process.exit(1);
}

module.exports = {
  // ===== BOT CORE SETTINGS =====
  SESSION_ID: settings.SESSION_ID || process.env.SESSION_ID, // No default fallback
  PREFIX: getConfig("PREFIX") || settings.PREFIX || ".", // Command prefix
  CHATBOT: getConfig("CHATBOT") || "on",
  BOT_NAME: getConfig("BOT_NAME") || process.env.BOT_NAME || "X-GURU",
  MODE: getConfig("MODE") || process.env.MODE || "private",
  REPO: process.env.REPO || "https://github.com/ADDICT-HUB/X-GURU",
  PAIRING_CODE: process.env.PARING_CODE || 'true',
  BAILEYS: process.env.BAILEYS || "@whiskeysockets/baileys",

  // ===== OWNER & DEVELOPER SETTINGS =====
  OWNER_NUMBER: settings.OWNER_NUMBER || process.env.OWNER_NUMBER || "254735403829",
  OWNER_NAME: getConfig("OWNER_NAME") || process.env.OWNER_NAME || "GuruTech",
  DEV: process.env.DEV || "254735403829",
  DEVELOPER_NUMBER: '254735403829@s.whatsapp.net',

  // ===== MEDIA & AUTOMATION =====
  MENU_AUDIO_URL: getConfig("MENU_AUDIO_URL") || process.env.MENU_AUDIO_URL || 'https://files.catbox.moe/jlf4l2.mp3',
  AUDIO_URL: getConfig("AUDIO_URL") || process.env.AUDIO_URL || 'https://files.catbox.moe/jlf4l2.mp3',
  AUDIO_URL2: getConfig("AUDIO_URL2") || process.env.AUDIO_URL2 || 'https://files.catbox.moe/jlf4l2.mp3',

  // ===== AUTO-RESPONSE SETTINGS =====
  AUTO_REPLY: getConfig("AUTO_REPLY") || process.env.AUTO_REPLY || "false",
  AUTO_STATUS_REPLY: getConfig("AUTO_STATUS_REPLY") || process.env.AUTO_STATUS_REPLY || "false",
  AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*Just seen ur status 😆 🤖*",
  READ_MESSAGE: getConfig("READ_MESSAGE") || process.env.READ_MESSAGE || "false",
  REJECT_MSG: process.env.REJECT_MSG || "*📵 Calls are not allowed on this number unless you have permission. 🚫*",
  ALIVE_IMG: getConfig("ALIVE_IMG") || process.env.ALIVE_IMG || "https://files.catbox.moe/75baia.jpg",
  LIVE_MSG: process.env.LIVE_MSG || "> ʙᴏᴛ ɪs sᴘᴀʀᴋɪɴɢ ᴀᴄᴛɪᴠᴇ ᴀɴᴅ ᴀʟɪᴠᴇ\n\n\n> ɢɪᴛʜᴜʙ :* github.com/ADDICT-HUB/X-GURU",

  // ===== SECURITY & ANTI-FEATURES =====
  ANTI_DELETE: getConfig("ANTI_DELETE") || process.env.ANTI_DELETE || "true",
  ANTI_CALL: getConfig("ANTI_CALL") || process.env.ANTI_CALL || "false",
  ANTI_BAD_WORD: getConfig("ANTI_BAD_WORD") || process.env.ANTI_BAD_WORD || "false",
  ANTI_LINK: getConfig("ANTI_LINK") || process.env.ANTI_LINK || "true",
  ANTI_VV: getConfig("ANTI_VV") || process.env.ANTI_VV || "true",
  DELETE_LINKS: getConfig("DELETE_LINKS") || process.env.DELETE_LINKS || "false",
  ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "inbox",
  ANTI_BOT: getConfig("ANTI_BOT") || process.env.ANTI_BOT || "true",
  PM_BLOCKER: getConfig("PM_BLOCKER") || process.env.PM_BLOCKER || "true",

  // ===== BOT BEHAVIOR & APPEARANCE =====
  DESCRIPTION: process.env.DESCRIPTION || "*ᴍᴀᴅᴇ ʙʏ ɢᴜʀᴜᴛᴇᴄʜ*",
  PUBLIC_MODE: getConfig("PUBLIC_MODE") || process.env.PUBLIC_MODE || "true",
  ALWAYS_ONLINE: getConfig("ALWAYS_ONLINE") || process.env.ALWAYS_ONLINE || "false",
  AUTO_STATUS_REACT: getConfig("AUTO_STATUS_REACT") || process.env.AUTO_STATUS_REACT || "true",
  AUTO_STATUS_SEEN: getConfig("AUTO_STATUS_SEEN") || process.env.AUTO_STATUS_SEEN || "true",
  AUTO_BIO: getConfig("AUTO_BIO") || process.env.AUTO_BIO || "true",
  WELCOME: getConfig("WELCOME") || process.env.WELCOME || "false",
  GOODBYE: getConfig("GOODBYE") || process.env.GOODBYE || "false",
  ADMIN_ACTION: getConfig("ADMIN_ACTION") || process.env.ADMIN_ACTION || "false",
  version: process.env.version || "1.5.0",
  TIMEZONE: settings.TIMEZONE || process.env.TIMEZONE || "Africa/Harare",

  // ===== CATEGORY-SPECIFIC IMAGE URLs =====
  MENU_IMAGES: {
    '1': process.env.DOWNLOAD_MENU_IMAGE || "https://url.bwmxmd.online/Adams.0dhfcjpi.jpeg",
    '2': process.env.GROUP_MENU_IMAGE || "https://url.bwmxmd.online/Adams.xm472dqv.jpeg",
    '3': process.env.FUN_MENU_IMAGE || "https://url.bwmxmd.online/Adams.0dhfcjpi.jpeg",
    '4': process.env.OWNER_MENU_IMAGE || "https://url.bwmxmd.online/Adams.0dhfcjpi.jpeg",
    '5': process.env.AI_MENU_IMAGE || "https://url.bwmxmd.online/Adams.zjrmnw18.jpeg",
    '6': process.env.ANIME_MENU_IMAGE || "https://url.bwmxmd.online/Adams.h0gop5c7.jpeg",
    '7': process.env.CONVERT_MENU_IMAGE || "https://url.bwmxmd.online/Adams.0dhfcjpi.jpeg",
    '8': process.env.OTHER_MENU_IMAGE || "https://url.bwmxmd.online/Adams.zjrmnw18.jpeg",
    '9': process.env.REACTION_MENU_IMAGE || "https://url.bwmxmd.online/Adams.xm472dqv.jpeg",
    '10': process.env.MAIN_MENU_IMAGE || "https://url.bwmxmd.online/Adams.0dhfcjpi.jpeg",
    '11': process.env.LOGO_MAKER_MENU_IMAGE || "https://url.bwmxmd.online/Adams.h0gop5c7.jpeg",
    '12': process.env.SETTINGS_MENU_IMAGE || "https://url.bwmxmd.online/Adams.0dhfcjpi.jpeg",
    '13': process.env.AUDIO_MENU_IMAGE || "https://url.bwmxmd.online/Adams.h0gop5c7.jpeg",
    '14': process.env.PRIVACY_MENU_IMAGE || "https://url.bwmxmd.online/Adams.xm472dqv.jpeg"
  }
};
