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
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`;

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

  malvin.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null) {
        await AntiDelete(malvin, updates);
      }
    }
  });
  
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
      console.error("Anti-call error:", err);
    }
  });

  // ========== SIMPLIFIED MESSAGE HANDLER - MINIMAL DEBUGGING ==========
  malvin.ev.on('messages.upsert', async (messageData) => {
    console.log('🔔 MESSAGE EVENT TRIGGERED!');
    
    try {
      if (!messageData || !messageData.messages || messageData.messages.length === 0) {
        console.log('No messages in data');
        return;
      }
      
      const mek = messageData.messages[0];
      if (!mek || !mek.message) {
        console.log('No message content');
        return;
      }
      
      console.log('📨 Message received from:', mek.key?.remoteJid);
      console.log('Message type:', getContentType(mek.message));
      
      // Skip bot's own messages
      if (mek.key.fromMe) {
        console.log('🤖 Skipping bot\'s own message');
        return;
      }
      
      // Fix message structure for ephemeral messages
      const contentType = getContentType(mek.message);
      if (contentType === 'ephemeralMessage') {
        mek.message = mek.message.ephemeralMessage.message;
        console.log('Fixed ephemeral message');
      }
      
      // Handle view once messages
      if (mek.message.viewOnceMessageV2) {
        mek.message = mek.message.viewOnceMessageV2.message;
        console.log('Fixed view once message');
      }
      
      // Read message if enabled
      if (config.READ_MESSAGE === 'true') {
        try {
          await malvin.readMessages([mek.key]);
        } catch (e) {
          console.log('Failed to read message:', e.message);
        }
      }
      
      // Handle status messages
      if (mek.key && mek.key.remoteJid === 'status@broadcast') {
        console.log('📱 Status update received');
        
        if (config.AUTO_STATUS_SEEN === "true") {
          await malvin.readMessages([mek.key]);
        }
        
        if (config.AUTO_STATUS_REACT === "true") {
          try {
            const jawadlike = malvin.user.id;
            const statusEmojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗'];
            const randomEmoji = statusEmojis[Math.floor(Math.random() * statusEmojis.length)];
            await malvin.sendMessage(mek.key.remoteJid, { 
              react: { text: randomEmoji, key: mek.key } 
            }, { statusJidList: [mek.key.participant, jawadlike] });
          } catch (e) {
            console.log('Failed to react to status:', e.message);
          }
        }
        
        if (config.AUTO_STATUS_REPLY === "true") {
          try {
            const user = mek.key.participant;
            const text = `${config.AUTO_STATUS_MSG || 'Nice status!'}`;
            await malvin.sendMessage(user, { text: text }, { quoted: mek });
          } catch (e) {
            console.log('Failed to reply to status:', e.message);
          }
        }
        return; // Don't process status as commands
      }
      
      // Save message to database
      try {
        await saveMessage(mek);
      } catch (e) {
        console.log('Failed to save message:', e.message);
      }
      
      // Initialize m variable with sms function
      let m;
      try {
        if (typeof sms === 'function') {
          m = sms(malvin, mek);
          console.log('✅ SMS function executed');
        } else {
          console.log('❌ SMS function not available');
          m = { message: mek.message };
        }
      } catch (e) {
        console.log('Failed to run sms function:', e.message);
        m = { message: mek.message };
      }
      
      // Extract message text
      const type = getContentType(mek.message);
      let body = '';
      
      if (type === 'conversation') {
        body = mek.message.conversation || '';
      } else if (type === 'extendedTextMessage') {
        body = mek.message.extendedTextMessage?.text || '';
      } else if (type === 'imageMessage') {
        body = mek.message.imageMessage?.caption || '';
      } else if (type === 'videoMessage') {
        body = mek.message.videoMessage?.caption || '';
      } else if (type === 'documentMessage') {
        body = mek.message.documentMessage?.caption || '';
      }
      
      console.log('📝 Message body:', body);
      
      if (!body || body.trim() === '') {
        console.log('Empty message body, skipping');
        return;
      }
      
      const prefix = getPrefix();
      console.log('🔤 Prefix:', prefix);
      
      const isCmd = body.startsWith(prefix);
      console.log('Is command?', isCmd);
      
      if (!isCmd) {
        console.log('Not a command, checking for auto-react');
        
        // Auto react if enabled
        if (config.AUTO_REACT === 'true') {
          try {
            const reactionsList = ['❤️', '🔥', '👍', '😄', '🎉'];
            const randomReaction = reactionsList[Math.floor(Math.random() * reactionsList.length)];
            await malvin.sendMessage(mek.key.remoteJid, {
              react: { 
                text: randomReaction, 
                key: mek.key
              }
            });
            console.log('✅ Auto-reacted to message');
          } catch (error) {
            console.log('Failed to auto-react:', error.message);
          }
        }
        return;
      }
      
      // It's a command!
      console.log('🎯 COMMAND DETECTED!');
      
      const command = body.slice(prefix.length).trim().split(' ').shift().toLowerCase();
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(' ');
      
      console.log('Command name:', command);
      console.log('Arguments:', args);
      console.log('Query:', q);
      
      const from = mek.key.remoteJid;
      const sender = mek.key.fromMe ? malvin.user.id : (mek.key.participant || mek.key.remoteJid);
      const isGroup = from.endsWith('@g.us');
      
      console.log('From JID:', from);
      console.log('Sender:', sender);
      console.log('Is group?', isGroup);
      
      // ADDED: Enhanced JID normalization for proper comparison
      const normalizeJid = (jid) => {
        if (!jid) return '';
        // Remove device identifier and ensure consistent format
        const parts = jid.split(':');
        if (parts.length > 1) {
          return parts[0] + '@s.whatsapp.net';
        }
        return jid;
      };
      
      const normalizedSender = normalizeJid(sender);
      const normalizedBotId = normalizeJid(malvin.user.id);
      const senderNumber = normalizedSender.split('@')[0];
      const botNumber = normalizedBotId.split('@')[0];
      
      console.log('📱 JID Analysis:', {
        originalSender: sender,
        normalizedSender,
        originalBotId: malvin.user.id,
        normalizedBotId,
        senderNumber,
        botNumber,
        isSameNumber: senderNumber === botNumber
      });
      
      // Check if user is banned
      try {
        const bannedUsers = JSON.parse(fsSync.readFileSync("./lib/ban.json", "utf-8") || "[]");
        if (bannedUsers.includes(sender)) {
          console.log('User is banned:', sender);
          return;
        }
      } catch (e) {
        console.log('Error reading ban list:', e.message);
      }
      
      // FIXED: Check if user is owner - COMPLETELY REWRITTEN
      let isRealOwner = false;
      try {
        const ownerFile = JSON.parse(fsSync.readFileSync("./lib/sudo.json", "utf-8") || "[]");
        const ownerNumber = config.OWNER_NUMBER || '';
        const ownerNumberFormatted = ownerNumber ? `${ownerNumber}@s.whatsapp.net` : '';
        
        // Remove + and any non-digit characters for comparison
        const cleanNumber = (num) => num.replace(/[^0-9]/g, '');
        const cleanSenderNumber = cleanNumber(senderNumber);
        const cleanOwnerNumber = cleanNumber(ownerNumber);
        const cleanBotNumber = cleanNumber(botNumber);
        
        console.log('🔍 Owner Detection Debug:', {
          sender,
          normalizedSender,
          senderNumber,
          cleanSenderNumber,
          ownerNumber,
          cleanOwnerNumber,
          botNumber,
          cleanBotNumber,
          ownerNumberFormatted,
          ownerFileLength: ownerFile.length
        });
        
        // Check multiple conditions for owner status
        const conditions = {
          // 1. Exact JID match with owner number from config
          exactConfigMatch: ownerNumberFormatted && normalizedSender === ownerNumberFormatted,
          
          // 2. Clean number match with owner number from config
          cleanConfigMatch: cleanOwnerNumber && cleanSenderNumber === cleanOwnerNumber,
          
          // 3. Is the linking device (same number as bot)
          isLinkingDevice: cleanSenderNumber === cleanBotNumber,
          
          // 4. In sudo.json file
          inSudoFile: ownerFile.includes(sender) || ownerFile.includes(normalizedSender),
          
          // 5. Hardcoded owner numbers (fallback)
          inHardcodedList: ownerNumber.includes(cleanSenderNumber)
        };
        
        console.log('✅ Owner Conditions:', conditions);
        
        // Combine all conditions
        isRealOwner = conditions.exactConfigMatch || 
                     conditions.cleanConfigMatch || 
                     conditions.isLinkingDevice || 
                     conditions.inSudoFile || 
                     conditions.inHardcodedList;
        
        console.log('🎯 Final Owner Status:', isRealOwner);
        
      } catch (e) {
        console.log('Error checking owner status:', e.message);
        // Fallback: If error, assume not owner
        isRealOwner = false;
      }
      
      // FIXED: MODE logic - Proper handling for all scenarios
      console.log('🔧 MODE Check:', {
        configMODE: config.MODE,
        isRealOwner,
        isGroup
      });
      
      if (!isRealOwner) {
        // Non-owner logic
        if (config.MODE === "private") {
          console.log('🚫 MODE=private, non-owner blocked');
          await malvin.sendMessage(from, { 
            text: `❌ Bot is in private mode. Only owner can use commands.\n\nOwner: ${config.OWNER_NUMBER || 'Not configured'}` 
          }, { quoted: mek });
          return;
        }
        if (config.MODE === "inbox" && isGroup) {
          console.log('🚫 MODE=inbox, group message from non-owner blocked');
          await malvin.sendMessage(from, { 
            text: `❌ Bot is in inbox mode. Commands only work in private chat.` 
          }, { quoted: mek });
          return;
        }
        if (config.MODE === "groups" && !isGroup) {
          console.log('🚫 MODE=groups, private message from non-owner blocked');
          await malvin.sendMessage(from, { 
            text: `❌ Bot is in groups mode. Commands only work in groups.` 
          }, { quoted: mek });
          return;
        }
      } else {
        console.log('✅ Owner detected, bypassing MODE restrictions');
        
        // Even in private mode, owner should get a confirmation
        if (config.MODE === "private") {
          console.log('👑 Owner using bot in private mode');
        }
      }
      
      console.log('✅ User has permission to use commands');
      
      // Load and execute command
      try {
        console.log('📂 Loading commands from ./malvin');
        const events = require('./malvin');
        
        if (!events || !events.commands || !Array.isArray(events.commands)) {
          console.log('❌ No commands found in malvin.js');
          await malvin.sendMessage(from, { 
            text: `❌ No commands configured. Please check malvin.js file.` 
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
        console.log('Has function?', typeof cmd.function === 'function');
        
        // Send command reaction if specified
        if (cmd.react) {
          try {
            await malvin.sendMessage(from, { react: { text: cmd.react, key: mek.key }});
            console.log('Sent command reaction:', cmd.react);
          } catch (error) {
            console.log('Failed to send command reaction:', error.message);
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
          isCmd,
          command,
          args,
          q,
          text: body,
          isGroup,
          sender,
          senderNumber: sender.split('@')[0],
          botNumber: malvin.user.id.split(':')[0],
          pushname: mek.pushName || 'User',
          isMe: false,
          isOwner: isRealOwner,
          reply
        };
        
        // Execute the command
        console.log('🚀 Executing command function...');
        await cmd.function(malvin, mek, m, tools);
        console.log(`✅ Command "${command}" executed successfully`);
        
      } catch (moduleError) {
        console.error('❌ COMMAND EXECUTION ERROR:', moduleError.message);
        console.error('Stack:', moduleError.stack);
        
        // Send error message
        try {
          await malvin.sendMessage(from, {
            text: `❌ Error executing command "${command}": ${moduleError.message}`
          }, { quoted: mek });
        } catch (sendError) {
          console.error('Failed to send error message:', sendError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ FATAL ERROR IN MESSAGE HANDLER:', error.message);
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
