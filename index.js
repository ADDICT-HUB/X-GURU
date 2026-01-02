// Anti-crash handler
process.on("uncaughtException", (err) => {
  console.error("[❗] Uncaught Exception:", err.stack || err);
});

process.on("unhandledRejection", (reason, p) => {
  console.error("[❗] Unhandled Promise Rejection:", reason);
});

// GuruTech 

const axios = require("axios");
const config = require("./settings");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidNormalizedUser,
  isJidBroadcast,
  getContentType,
  proto,
  generateWAMessageContent,
  generateWAMessage,
  AnyMessageContent,
  prepareWAMessageMedia,
  areJidsSameUser,
  downloadContentFromMessage,
  MessageRetryMap,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers,
} = require(config.BAILEYS);

const l = console.log;
const {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson,
} = require("./lib/functions");
const {
  AntiDelDB,
  initializeAntiDeleteSettings,
  setAnti,
  getAnti,
  getAllAntiDeleteSettings,
  saveContact,
  loadMessage,
  getName,
  getChatSummary,
  saveGroupMetadata,
  getGroupMetadata,
  saveMessageCount,
  getInactiveGroupMembers,
  getGroupMembersMessageCount,
  saveMessage,
} = require("./data");
const fsSync = require("fs");
const fs = require("fs").promises;
const ff = require("fluent-ffmpeg");
const P = require("pino");
const GroupEvents = require("./lib/groupevents");
const { PresenceControl, BotActivityFilter } = require("./data/presence");
const qrcode = require("qrcode-terminal");
const StickersTypes = require("wa-sticker-formatter");
const util = require("util");
const { sms, downloadMediaMessage, AntiDelete } = require("./lib");
const FileType = require("file-type");
const { File } = require("megajs");
const bodyparser = require("body-parser");
const chalk = require("chalk");
const os = require("os");
const Crypto = require("crypto");
const path = require("path");
const { getPrefix } = require("./lib/prefix");
const readline = require("readline");

const ownerNumber = ["218942841878"];

// Temp directory management
const tempDir = path.join(os.tmpdir(), "cache-temp");
if (!fsSync.existsSync(tempDir)) {
  fsSync.mkdirSync(tempDir);
}

const clearTempDir = () => {
  fsSync.readdir(tempDir, (err, files) => {
    if (err) {
      console.error(chalk.red("[❌] Error clearing temp directory:", err.message));
      return;
    }
    for (const file of files) {
      fsSync.unlink(path.join(tempDir, file), (err) => {
        if (err) console.error(chalk.red(`[❌] Error deleting temp file ${file}:`, err.message));
      });
    }
  });
};
setInterval(clearTempDir, 5 * 60 * 1000);

// Express server (placeholder for future API routes)
const express = require("express");
const app = express();
const port = process.env.PORT || 7860;

// Session authentication
let malvin;

const sessionDir = path.join(__dirname, "./sessions");
const credsPath = path.join(sessionDir, "creds.json");

if (!fsSync.existsSync(sessionDir)) {
  fsSync.mkdirSync(sessionDir, { recursive: true });
}

async function loadSession() {
  try {
    if (!config.SESSION_ID) {
      console.log(chalk.red("No SESSION_ID provided - Falling back to QR or pairing code"));
      return null;
    }

    if (config.SESSION_ID.startsWith("Xguru~")) {
      console.log(chalk.yellow("[ ⏳ ] Decoding base64 session..."));
      const base64Data = config.SESSION_ID.replace("Xguru~", "");
      if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
        throw new Error("Invalid base64 format in SESSION_ID");
      }
      const decodedData = Buffer.from(base64Data, "base64");
      let sessionData;
      try {
        sessionData = JSON.parse(decodedData.toString("utf-8"));
      } catch (error) {
        throw new Error("Failed to parse decoded base64 session data: " + error.message);
      }
      fsSync.writeFileSync(credsPath, decodedData);
      console.log(chalk.green("[ ✅ ] Base64 session decoded and saved successfully"));
      return sessionData;
    } else if (config.SESSION_ID.startsWith("Xguru~")) {
      console.log(chalk.yellow("[ ⏳ ] Downloading MEGA.nz session..."));
      const megaFileId = config.SESSION_ID.replace("Xguru~", "");
      const filer = File.fromURL(`https://mega.nz/file/${megaFileId}`);
      const data = await new Promise((resolve, reject) => {
        filer.download((err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
      fsSync.writeFileSync(credsPath, data);
      console.log(chalk.green("[ ✅ ] MEGA session downloaded successfully"));
      return JSON.parse(data.toString());
    } else {
      throw new Error("Invalid SESSION_ID format. Use 'Xguru~' for base64 or 'Xguru~' for MEGA.nz");
    }
  } catch (error) {
    console.error(chalk.red("❌ Error loading session:", error.message));
    console.log(chalk.green("Will attempt QR code or pairing code login"));
    return null;
  }
}

async function connectWithPairing(malvin, useMobile) {
  if (useMobile) {
    throw new Error("Cannot use pairing code with mobile API");
  }
  if (!process.stdin.isTTY) {
    console.error(chalk.red("❌ Cannot prompt for phone number in non-interactive environment"));
    process.exit(1);
  }

  console.log(chalk.bgYellow.black(" ACTION REQUIRED "));
  console.log(chalk.green("┌" + "─".repeat(46) + "┐"));
  console.log(chalk.green("│ ") + chalk.bold("Enter WhatsApp number to receive pairing code") + chalk.green(" │"));
  console.log(chalk.green("└" + "─".repeat(46) + "┘"));
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const question = (text) => new Promise((resolve) => rl.question(text, resolve));

  let number = await question(chalk.cyan("» Enter your number (e.g., +254740007567): "));
  number = number.replace(/[^0-9]/g, "");
  rl.close();

  if (!number) {
    console.error(chalk.red("❌ No phone number provided"));
    process.exit(1);
  }

  try {
    let code = await malvin.requestPairingCode(number);
    code = code?.match(/.{1,4}/g)?.join("-") || code;
    console.log("\n" + chalk.bgGreen.black(" SUCCESS ") + " Use this pairing code:");
    console.log(chalk.bold.yellow("┌" + "─".repeat(46) + "┐"));
    console.log(chalk.bold.yellow("│ ") + chalk.bgWhite.black(code) + chalk.bold.yellow(" │"));
    console.log(chalk.bold.yellow("└" + "─".repeat(46) + "┘"));
    console.log(chalk.yellow("Enter this code in WhatsApp:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap 'Link a Device'\n4. Enter the code"));
  } catch (err) {
    console.error(chalk.red("Error getting pairing code:", err.message));
    process.exit(1);
  }
}

// Helper functions - MOVED INSIDE connectToWA function
function addHelperFunctions(malvin) {
  // Helper functions for malvin object
  malvin.copyNForward = async(jid, message, forceForward = false, options = {}) => {
    let vtype;
    if (options.readViewOnce) {
      message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined);
      vtype = Object.keys(message.message.viewOnceMessage.message)[0];
      delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined));
      delete message.message.viewOnceMessage.message[vtype].viewOnce;
      message.message = { ...message.message.viewOnceMessage.message };
    }
    let mtype = Object.keys(message.message)[0];
    let content = await generateForwardMessageContent(message, forceForward);
    let ctype = Object.keys(content)[0];
    let context = {};
    if (mtype != "conversation") context = message.message[mtype].contextInfo;
    content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
    const waMessage = await generateWAMessageFromContent(jid, content, options ? { ...content[ctype], ...options } : {});
    await malvin.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
    return waMessage;
  };

  // Fixed download function with FileType.fromBuffer
  malvin.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
    let type = await FileType.fromBuffer(buffer);
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
    await fs.writeFile(trueFileName, buffer);
    return trueFileName;
  };

  malvin.downloadMediaMessage = async(message) => {
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }
    return buffer;
  };

  malvin.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    let res = await axios.head(url);
    let mime = res.headers['content-type'];
    if (mime.split("/")[1] === "gif") return malvin.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted });
    if (mime === "application/pdf") return malvin.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted });
    if (mime.split("/")[0] === "image") return malvin.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted });
    if (mime.split("/")[0] === "video") return malvin.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted });
    if (mime.split("/")[0] === "audio") return malvin.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted });
  };

  malvin.cMod = (jid, copy, text = '', sender = malvin.user.id, options = {}) => {
    let mtype = Object.keys(copy.message)[0];
    let isEphemeral = mtype === 'ephemeralMessage';
    if (isEphemeral) mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
    let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
    let content = msg[mtype];
    if (typeof content === 'string') msg[mtype] = text || content;
    else if (content.caption) content.caption = text || content.caption;
    else if (content.text) content.text = text || content.text;
    if (typeof content !== 'string') msg[mtype] = { ...content, ...options };
    copy.key.remoteJid = jid;
    copy.key.fromMe = sender === malvin.user.id;
    return proto.WebMessageInfo.fromObject(copy);
  };

  malvin.getFile = async(PATH, save) => {
    let res;
    let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fsSync.existsSync(PATH) ? fsSync.readFileSync(PATH) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
    let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
    let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext);
    if (data && save) fs.writeFile(filename, data);
    return { res, filename, size: data.length, ...type, data };
  };

  malvin.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
    let types = await malvin.getFile(PATH, true);
    let { filename, mime, data } = types;
    let type = /image/.test(mime) ? 'image' : /video/.test(mime) ? 'video' : /audio/.test(mime) ? 'audio' : 'document';
    await malvin.sendMessage(jid, { [type]: { url: filename }, mimetype: mime, fileName, ...options }, { quoted });
    return fs.unlink(filename);
  };

  malvin.parseMention = async(text) => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
  };

  malvin.getName = (jid, withoutContact = false) => {
    let id = jidDecode(jid)?.user + '@s.whatsapp.net' || jid;
    let v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } : 
            id === (jidDecode(malvin.user.id)?.user + '@s.whatsapp.net' || malvin.user.id) ? 
            malvin.user : {};
    return v.name || v.subject || v.verifiedName || jid.split('@')[0];
  };

  malvin.sendContact = async (jid, kon, quoted = '', opts = {}) => {
    let list = [];
    for (let i of kon) {
      list.push({
        displayName: await malvin.getName(i + '@s.whatsapp.net'),
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await malvin.getName(i + '@s.whatsapp.net')}\nFN:Owner\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nEND:VCARD`,
      });
    }
    malvin.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted });
  };

  malvin.setStatus = status => {
    malvin.query({ tag: 'iq', attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' }, content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }] });
    return status;
  };

  malvin.serializeM = mek => sms(malvin, mek);
}

async function connectToWA() {
  console.log(chalk.cyan("[ 🟠 ] Connecting to WhatsApp ⏳️..."));

  const creds = await loadSession();
  const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "./sessions"), {
    creds: creds || undefined,
  });

  const { version } = await fetchLatestBaileysVersion();

  const pairingCode = config.PAIRING_CODE === "true" || process.argv.includes("--pairing-code");
  const useMobile = process.argv.includes("--mobile");

  malvin = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: !creds && !pairingCode,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: true,
    auth: state,
    version,
    getMessage: async () => ({}),
  });

  // ADD HELPER FUNCTIONS HERE - AFTER malvin IS CREATED
  addHelperFunctions(malvin);

  if (pairingCode && !state.creds.registered) {
    await connectWithPairing(malvin, useMobile);
  }

  malvin.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red("[ 🛑 ] Connection closed, please change session ID or re-authenticate"));
        if (fsSync.existsSync(credsPath)) {
          fsSync.unlinkSync(credsPath);
        }
        process.exit(1);
      } else {
        console.log(chalk.red("[ ⏳️ ] Connection lost, reconnecting..."));
        setTimeout(connectToWA, 5000);
      }
    } else if (connection === "open") {
      console.log(chalk.green("[ 🤖 ] Xguru Connected ✅"));

      // Load plugins
      const pluginPath = path.join(__dirname, "plugins");
      try {
        const plugins = fsSync.readdirSync(pluginPath);
        let loadedCount = 0;
        let errorCount = 0;
        
        for (const plugin of plugins) {
          if (path.extname(plugin).toLowerCase() === ".js") {
            try {
              require(path.join(pluginPath, plugin));
              loadedCount++;
            } catch (err) {
              errorCount++;
              console.error(chalk.red(`[ ❌ ] Failed to load plugin ${plugin}:`), err.message);
            }
          }
        }
        
        console.log(chalk.green(`[ ✅ ] Plugins loaded: ${loadedCount} successful, ${errorCount} failed`));
      } catch (err) {
        console.error(chalk.red("[ ❌ ] Error accessing plugins directory:"), err.message);
      }

      // Send connection message
      try {
        await sleep(2000);
        const jid = malvin.user.id;
        if (!jid) throw new Error("Invalid JID for bot");

        const botname = "𝗫𝗚𝗨𝗥𝗨";
        const ownername = "𝗚𝗨𝗥𝗨";
        const prefix = getPrefix();
        const username = "𝗚𝘂𝗿𝘂𝗧𝗲𝗰𝗵";
        const mrmalvin = `https://github.com/${username}`;
        const repoUrl = "https://github.com/betingrich4/Mercedes";
        const welcomeAudio = "https://files.catbox.moe/z47dgd.p3";
        
        const currentDate = new Date();
        const date = currentDate.toLocaleDateString();
        const time = currentDate.toLocaleTimeString();
        
        function formatUptime(seconds) {
          const days = Math.floor(seconds / (24 * 60 * 60));
          seconds %= 24 * 60 * 60;
          const hours = Math.floor(seconds / (60 * 60));
          seconds %= 60 * 60;
          const minutes = Math.floor(seconds / 60);
          seconds = Math.floor(seconds % 60);
          return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
        
        const uptime = formatUptime(process.uptime());

        const upMessage = `
▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▄
█        𝗫𝗚𝗨𝗥𝗨 𝗕𝗢𝗧 𝗢𝗡𝗟𝗜𝗡𝗘        █
█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀𝗚𝗨𝗥𝗨▀▀▀▀▀▀▀▀▀█
█ • 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}
█ • 𝗗𝗮𝘁𝗲: ${date}
█ • 𝗧𝗶𝗺𝗲: ${time}
█ • 𝗨𝗽𝘁𝗶𝗺𝗲: ${uptime}
█ • 𝗢𝘄𝗻𝗲𝗿: ${ownername}
█ • 𝗖𝗵𝗮𝗻𝗻𝗲𝗹: https://shorturl.at/DYEi0
█
█ ⚡ 𝗥𝗲𝗽𝗼𝗿𝘁 𝗲𝗿𝗿𝗼𝗿𝘀 𝘁𝗼 𝗱𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀𝗚𝗨𝗥𝗨▀▀▀▀▀▀`;

        // Send text-only message
        await malvin.sendMessage(jid, { text: upMessage });
        console.log(chalk.green("[ 📩 ] Connection notice sent successfully (text-only)"));

        try {
          await malvin.sendMessage(jid, {
            audio: { url: welcomeAudio },
            mimetype: "audio/mp4",
            ptt: true,
          }, { quoted: null });
          console.log(chalk.green("[ 📩 ] Connection notice sent successfully as audio"));
        } catch (audioError) {
          console.error(chalk.yellow("[ ⚠️ ] Audio failed:"), audioError.message);
        }
      } catch (sendError) {
        console.error(chalk.red(`[ 🔴 ] Error sending connection notice:`), sendError.message);
      }
      
      // Newsletter following - DISABLED
      console.log(chalk.yellow('[ ℹ️ ] Newsletter auto-follow is disabled'));
      
      // Join WhatsApp group
      const inviteCode = "BEAT3drbrCJ4t29Flv0vwC";
      try {
        await malvin.groupAcceptInvite(inviteCode);
        console.log(chalk.green("[ ✅ ] joined the WhatsApp group successfully"));
      } catch (err) {
        console.error(chalk.red("[ ❌ ] Failed to join WhatsApp group:", err.message));
      }
    }

    if (qr && !pairingCode) {
      console.log(chalk.red("[ 🟢 ] Scan the QR code to connect or use --pairing-code"));
      qrcode.generate(qr, { small: true });
    }
  });

  malvin.ev.on("creds.update", saveCreds);

  // Anti-delete handler
  malvin.ev.on('messages.update', async updates => {
    try {
      for (const update of updates) {
        if (update.update.message === null) {
          await AntiDelete(malvin, updates);
        }
      }
    } catch (error) {
      // Silent fail
    }
  });
  
  // Anti-call handler
  malvin.ev.on('call', async (calls) => {
    try {
      if (config.ANTI_CALL !== 'true') return;
      for (const call of calls) {
        if (call.status !== 'offer') continue;
        const id = call.id;
        const from = call.from;
        await malvin.rejectCall(id, from);
        await malvin.sendMessage(from, { text: config.REJECT_MSG || '*вυѕу ¢αℓℓ ℓαтєя*' });
      }
    } catch (err) {
      // Silent fail
    }
  });

  // ========== SIMPLE WORKING MESSAGE HANDLER ==========
  malvin.ev.on('messages.upsert', async (messageData) => {
    try {
      console.log('📩 MESSAGE RECEIVED EVENT');
      
      if (!messageData || !messageData.messages || messageData.messages.length === 0) {
        console.log('❌ No messages in event');
        return;
      }
      
      const mek = messageData.messages[0];
      
      // Debug log
      console.log('🔍 Message debug:', {
        from: mek.key?.remoteJid,
        participant: mek.key?.participant,
        hasMessage: !!mek.message,
        messageType: mek.message ? Object.keys(mek.message)[0] : 'none'
      });
      
      // Skip if no message
      if (!mek.message) {
        console.log('❌ No message content');
        return;
      }
      
      // Skip bot's own messages
      if (mek.key.fromMe) {
        console.log('🤖 Skipping bot\'s own message');
        return;
      }
      
      const from = mek.key.remoteJid;
      const sender = mek.key.fromMe ? malvin.user.id : (mek.key.participant || mek.key.remoteJid);
      const isGroup = from.endsWith('@g.us');
      
      console.log('👤 Sender:', sender);
      console.log('📍 From:', from);
      console.log('👥 Is group:', isGroup);
      
      // Extract message text - SIMPLE AND RELIABLE
      let body = '';
      const msgContent = mek.message;
      
      if (msgContent.conversation) {
        body = msgContent.conversation;
      } else if (msgContent.extendedTextMessage && msgContent.extendedTextMessage.text) {
        body = msgContent.extendedTextMessage.text;
      } else if (msgContent.imageMessage && msgContent.imageMessage.caption) {
        body = msgContent.imageMessage.caption;
      } else if (msgContent.videoMessage && msgContent.videoMessage.caption) {
        body = msgContent.videoMessage.caption;
      } else if (msgContent.documentMessage && msgContent.documentMessage.caption) {
        body = msgContent.documentMessage.caption;
      }
      
      console.log('💬 Message text:', body);
      
      // Skip if empty
      if (!body || body.trim() === '') {
        console.log('📭 Empty message, skipping');
        return;
      }
      
      // Check if it's a command
      const prefix = getPrefix();
      console.log('🔤 Prefix:', prefix);
      
      if (!body.startsWith(prefix)) {
        console.log('❌ Not a command');
        return;
      }
      
      console.log('🎯 COMMAND DETECTED!');
      
      // Extract command
      const command = body.slice(prefix.length).trim().split(' ').shift().toLowerCase();
      const args = body.trim().split(/ +/).slice(1);
      
      console.log('📋 Command:', command);
      console.log('🔢 Args:', args);
      
      // Check banned users
      try {
        const bannedUsers = JSON.parse(fsSync.readFileSync("./lib/ban.json", "utf-8") || "[]");
        if (bannedUsers.includes(sender)) {
          console.log('🚫 User is banned:', sender);
          return;
        }
      } catch (e) {
        console.log('⚠️ Error reading ban list');
      }
      
      // OWNER DETECTION - SIMPLE AND RELIABLE
      let isOwner = false;
      
      try {
        // Get clean numbers (remove +, @s.whatsapp.net, device identifiers)
        const getCleanNumber = (jid) => {
          if (!jid) return '';
          const num = jid.split('@')[0];  // Remove @s.whatsapp.net
          const cleanNum = num.split(':')[0];  // Remove device identifier (:0, :1, etc.)
          return cleanNum.replace(/\D/g, '');  // Remove all non-digits
        };
        
        const senderClean = getCleanNumber(sender);
        const botClean = getCleanNumber(malvin.user.id);
        
        console.log('🔍 Owner check:', {
          senderClean,
          botClean,
          isSame: senderClean === botClean,
          botJID: malvin.user.id
        });
        
        // Person who linked the bot IS THE OWNER
        isOwner = senderClean === botClean;
        
        // If not linking person, check sudo.json
        if (!isOwner) {
          try {
            const sudoList = JSON.parse(fsSync.readFileSync("./lib/sudo.json", "utf-8") || "[]");
            if (sudoList.includes(sender)) {
              isOwner = true;
              console.log('✅ User is in sudo.json');
            }
          } catch (e) {
            console.log('⚠️ Error reading sudo.json');
          }
        }
      } catch (error) {
        console.log('⚠️ Error in owner detection:', error.message);
        isOwner = false;
      }
      
      console.log('👑 Is owner?', isOwner);
      
      // MODE LOGIC
      if (!isOwner) {
        if (config.MODE === "private") {
          console.log('🚫 Private mode - non-owner blocked');
          await malvin.sendMessage(from, {
            text: `❌ Bot is in private mode. Only the person who linked this bot can use commands.\n\nBot was linked by: ${malvin.user.id.split('@')[0]}`
          }, { quoted: mek });
          return;
        }
        if (config.MODE === "inbox" && isGroup) {
          console.log('🚫 Inbox mode - group message blocked');
          await malvin.sendMessage(from, {
            text: `❌ Bot is in inbox mode. Commands only work in private chat.`
          }, { quoted: mek });
          return;
        }
        if (config.MODE === "groups" && !isGroup) {
          console.log('🚫 Groups mode - private message blocked');
          await malvin.sendMessage(from, {
            text: `❌ Bot is in groups mode. Commands only work in groups.`
          }, { quoted: mek });
          return;
        }
      }
      
      console.log('✅ User has permission');
      
      // Load and execute command
      try {
        const events = require('./malvin');
        
        if (!events || !events.commands || !Array.isArray(events.commands)) {
          console.log('❌ No commands found in malvin.js');
          await malvin.sendMessage(from, {
            text: '❌ No commands configured. Please check malvin.js file.'
          }, { quoted: mek });
          return;
        }
        
        console.log(`📚 Found ${events.commands.length} commands`);
        
        // Find the command
        let cmd = null;
        for (const c of events.commands) {
          if (c.pattern === command) {
            cmd = c;
            break;
          }
          if (c.alias && Array.isArray(c.alias) && c.alias.includes(command)) {
            cmd = c;
            break;
          }
        }
        
        if (!cmd) {
          console.log(`❌ Command "${command}" not found`);
          await malvin.sendMessage(from, {
            text: `❌ Command "${command}" not found. Type ${prefix}menu for available commands.`
          }, { quoted: mek });
          return;
        }
        
        console.log(`✅ Found command: ${cmd.pattern || cmd.alias?.[0]}`);
        
        // Send command reaction if specified
        if (cmd.react) {
          try {
            await malvin.sendMessage(from, { react: { text: cmd.react, key: mek.key }});
            console.log('✅ Sent reaction:', cmd.react);
          } catch (error) {
            console.log('⚠️ Failed to send reaction');
          }
        }
        
        // Prepare tools object
        const reply = (text) => {
          const message = `${text}\n\n*NI MBAYA 😅*`;
          return malvin.sendMessage(from, { text: message }, { quoted: mek });
        };
        
        const tools = {
          from,
          quoted: mek,
          body,
          isCmd: true,
          command,
          args,
          q: args.join(' '),
          text: body,
          isGroup,
          sender,
          senderNumber: sender.split('@')[0],
          botNumber: malvin.user.id.split(':')[0],
          pushname: mek.pushName || 'User',
          isMe: false,
          isOwner,
          reply
        };
        
        // Initialize m variable
        let m;
        try {
          if (typeof sms === 'function') {
            m = sms(malvin, mek);
          } else {
            m = { message: mek.message };
          }
        } catch (e) {
          m = { message: mek.message };
        }
        
        // Execute the command
        console.log('🚀 Executing command...');
        await cmd.function(malvin, mek, m, tools);
        console.log(`✅ Command "${command}" executed successfully`);
        
      } catch (moduleError) {
        console.error('❌ COMMAND ERROR:', moduleError.message);
        console.error('Stack:', moduleError.stack);
        
        try {
          await malvin.sendMessage(from, {
            text: `❌ Error executing command "${command}": ${moduleError.message}`
          }, { quoted: mek });
        } catch (sendError) {
          console.log('⚠️ Failed to send error message');
        }
      }
      
    } catch (error) {
      console.error('❌ GLOBAL MESSAGE HANDLER ERROR:', error.message);
      console.error('Stack:', error.stack);
    }
  });
  // ========== END OF MESSAGE HANDLER ==========
  
}

// Express routes
app.use(express.static(path.join(__dirname, "lib")));
app.get("/", (req, res) => { 
  res.redirect("/marisel.html"); 
});

app.listen(port, () => {
  console.log(chalk.cyan(`\n╭──[ hello user ]─\n│🤗 hi your bot is live \n╰──────────────`));
});

setTimeout(() => { 
  connectToWA(); 
}, 4000);
