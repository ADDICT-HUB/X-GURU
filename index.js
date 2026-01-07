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
const moment = require('moment-timezone');
moment.tz.setDefault(config.TIMEZONE);

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
const readline = require("readline");

// Removed hardcoded owner - now dynamic
let ownerNumber = [];

// Flood tracking
const floodMap = new Map(); // sender => {count, timer}

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

// Express server
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
    } else {
      throw new Error("Invalid SESSION_ID format.");
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

// Helper functions
function addHelperFunctions(malvin) {
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
    let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fsSync.existsSync(PATH) ? fsSync.readFileSync(PATH) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
    let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
    let filename = path.join(__dirname, new Date() * 1 + '.' + type.ext);
    if (data && save) await fs.writeFile(filename, data);
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
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:\( {await malvin.getName(i + '@s.whatsapp.net')}\nFN: \){config.OWNER_NAME}\nitem1.TEL;waid=\( {i}: \){i}\nitem1.X-ABLabel:Click here to chat\nEND:VCARD`,
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
    browser: Browsers.windows("Chrome"),
    syncFullHistory: true,
    markOnlineOnConnect: true,
    emitOwnEvents: true,
    generateHighQualityLinkPreview: true,
    auth: state,
    version,
    getMessage: async () => ({}),
  });

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

      const linkedNumber = malvin.user.id.split(':')[0];
      ownerNumber = [linkedNumber];
      console.log(chalk.green(`[ 👤 ] Owner set dynamically to linked number: ${linkedNumber}`));

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

      // Startup message
      try {
        await sleep(2000);
        const jid = malvin.user.id;
        const botname = config.BOT_NAME;
        const ownername = config.OWNER_NAME;
        let prefix = config.PREFIX;

        const date = moment().format('YYYY-MM-DD');
        const time = moment().format('HH:mm:ss');
        const uptime = runtime(process.uptime());

        const upMessage = `
▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▄
█        ${botname} 𝗕𝗢𝗧 𝗢𝗡𝗟𝗜𝗡𝗘        █
█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█ • 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}
█ • 𝗗𝗮𝘁𝗲: ${date}
█ • 𝗧𝗶𝗺𝗲: ${time}
█ • 𝗨𝗽𝘁𝗶𝗺𝗲: ${uptime}
█ • 𝗢𝘄𝗻𝗲𝗿: ${ownername}
█ • 𝗖𝗵𝗮𝗻𝗻𝗲𝗹: https://shorturl.at/DYEi0
█ • 𝗥𝗲𝗽𝗼: ${config.REPO}
█ • 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: ${config.version}
█
█ ⚡ 𝗥𝗲𝗽𝗼𝗿𝘁 𝗲𝗿𝗿𝗼𝗿𝘀 𝘁𝗼 𝗱𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`;

        await malvin.sendMessage(jid, { text: upMessage });
        console.log(chalk.green("[ 📩 ] Connection notice sent successfully"));

        try {
          await malvin.sendMessage(jid, {
            audio: { url: config.AUDIO_URL || config.MENU_AUDIO_URL },
            mimetype: "audio/mp4",
            ptt: true,
          });
          console.log(chalk.green("[ 📩 ] Startup audio sent"));
        } catch (e) {
          console.error(chalk.yellow("[ ⚠️ ] Audio failed"));
        }
      } catch (e) {}

      // Auto features
      if (config.AUTO_BIO === 'true') {
        setInterval(async () => {
          const bio = `${config.BOT_NAME} | ${moment().format('HH:mm:ss')} | Owner: ${config.OWNER_NAME}`;
          await malvin.updateProfileStatus(bio);
        }, 60000);
      }

      if (config.ALWAYS_ONLINE === 'true') {
        setInterval(() => malvin.sendPresenceUpdate('available'), 10000);
      }
    }

    if (qr && !pairingCode) {
      console.log(chalk.red("[ 🟢 ] Scan the QR code to connect or use --pairing-code"));
      qrcode.generate(qr, { small: true });
    }
  });

  malvin.ev.on("creds.update", saveCreds);

  malvin.ev.on('messages.update', async updates => {
    if (config.ANTI_DELETE === 'true') {
      for (const update of updates) {
        if (update.update.message === null) {
          await AntiDelete(malvin, updates);
        }
      }
    }
  });

  malvin.ev.on('call', async (calls) => {
    if (config.ANTI_CALL !== 'true') return;
    for (const call of calls) {
      if (call.status !== 'offer') continue;
      await malvin.rejectCall(call.id, call.from);
      await malvin.sendMessage(call.from, { text: config.REJECT_MSG });
    }
  });

  malvin.ev.on('group-participants.update', async (update) => {
    const { id, participants, action } = update;
    for (let user of participants) {
      const num = user.split('@')[0];
      if (action === 'add' && config.WELCOME === 'true') {
        await malvin.sendMessage(id, { text: `Welcome @${num} to the group! 👋`, mentions: [user] });
      } else if (action === 'remove' && config.GOODBYE === 'true') {
        await malvin.sendMessage(id, { text: `Goodbye @${num} 👋`, mentions: [user] });
      }
    }
  });

  malvin.ev.on('messages.upsert', async (messageData) => {
    try {
      if (!messageData?.messages?.length) return;
      const mek = messageData.messages[0];
      if (!mek.message || mek.key.fromMe) return;

      const from = mek.key.remoteJid;
      const sender = mek.key.participant || mek.key.remoteJid;
      const senderNumber = sender.split('@')[0];
      const botNumber = malvin.user.id.split(':')[0];
      const isGroup = from.endsWith('@g.us');

      let isRealOwner = ownerNumber.includes(senderNumber) || senderNumber === botNumber;
      try {
        const sudo = JSON.parse(fsSync.readFileSync("./lib/sudo.json", "utf-8") || "[]");
        if (sudo.includes(senderNumber)) isRealOwner = true;
      } catch (e) {}

      if (config.MODE === "private" && !isRealOwner) return;
      if (config.MODE === "inbox" && isGroup && !isRealOwner) return;
      if (config.MODE === "groups" && !isGroup && !isRealOwner) return;

      if (!isGroup && !isRealOwner && config.PM_BLOCKER === 'true') {
        await malvin.updateBlockStatus(from, 'block');
        return;
      }

      try {
        const banned = JSON.parse(fsSync.readFileSync("./lib/ban.json", "utf-8") || "[]");
        if (banned.includes(sender)) return;
      } catch (e) {}

      if (config.READ_MESSAGE === 'true') {
        await malvin.readMessages([mek.key]);
      }

      // Status broadcast handling
      if (from === 'status@broadcast') {
        if (config.AUTO_STATUS_SEEN === 'true') await malvin.readMessages([mek.key]);
        if (config.AUTO_STATUS_REACT === 'true') {
          const emojis = ['👍','❤️','😍','😂','🤩','😮','🔥','🎉','😄','💯','🙌','👏','😲','🥰','🤗','😜','🤯','🚀','💥','✨','🌟','🎊'];
          await malvin.sendMessage(from, { react: { text: getRandom(emojis), key: mek.key } });
        }
        if (config.AUTO_STATUS_REPLY === 'true') {
          await malvin.sendMessage(sender, { text: config.AUTO_STATUS_MSG });
        }
        return;
      }

      if (config.AUTO_TYPING === 'true') await malvin.sendPresenceUpdate('composing', from);
      if (config.AUTO_RECORDING === 'true') await malvin.sendPresenceUpdate('recording', from);

      const type = getContentType(mek.message);
      let body = type === 'conversation' ? mek.message.conversation : 
                 (type === 'extendedTextMessage' ? mek.message.extendedTextMessage.text : 
                 (mek.message[type]?.caption || ''));

      // Anti View Once
      if (mek.message.viewOnceMessage && config.ANTI_VV === 'true') {
        await malvin.copyNForward(from, mek, false, { readViewOnce: true });
      }

      // Mention reply
      if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.includes(malvin.user.id) && config.MENTION_REPLY === 'true') {
        await malvin.sendMessage(from, { text: 'Yes boss? How can I help? 😄' });
      }

      // === ANTI-SPAM FILTERS ===
      if (isGroup) {
        const metadata = await malvin.groupMetadata(from);
        const admins = getGroupAdmins(metadata.participants);
        const isBotAdmin = admins.includes(malvin.user.id);

        // Anti-Bot
        if (config.ANTI_BOT === 'true' && mek.message?.protocolMessage) {
          if (isBotAdmin) await malvin.sendMessage(from, { delete: mek.key });
          return;
        }

        // Anti-Flood
        if (config.ANTI_FLOOD === 'true') {
          const limit = parseInt(config.FLOOD_LIMIT) || 7;
          if (!floodMap.has(sender)) {
            floodMap.set(sender, { count: 1, timer: setTimeout(() => floodMap.delete(sender), 10000) });
          } else {
            const data = floodMap.get(sender);
            data.count++;
            if (data.count > limit && isBotAdmin) {
              await malvin.sendMessage(from, { text: `@${senderNumber} Flood detected!`, mentions: [sender] });
              if (config.AUTO_MUTE_SPAMMER === 'true') {
                await malvin.groupParticipantsUpdate(from, [sender], "remove");
              }
              floodMap.delete(sender);
              return;
            }
          }
        }

        // Anti-Link & Spam Links
        if ((config.ANTI_LINK === 'true' || config.ANTI_SPAM_LINKS === 'true') && isUrl(body)) {
          const spamLinks = ['t.me','bit.ly','tinyurl','goo.gl','shorturl.at','cutt.ly','linkvertise','adf.ly','ouo.io'];
          if (spamLinks.some(l => body.toLowerCase().includes(l)) || config.ANTI_LINK === 'true') {
            if (isBotAdmin) {
              await malvin.sendMessage(from, { delete: mek.key });
              if (config.AUTO_MUTE_SPAMMER === 'true') {
                await malvin.sendMessage(from, { text: `@${senderNumber} Spam link not allowed!`, mentions: [sender] });
                await malvin.groupParticipantsUpdate(from, [sender], "remove");
              }
            }
            return;
          }
        }

        // Anti-Foreigner
        if (config.ANTI_FOREIGNER === 'true') {
          const allowed = (config.ALLOWED_COUNTRY_CODES || "").split(',').map(c => c.trim());
          if (allowed.length > 0 && !allowed.some(code => senderNumber.startsWith(code)) && isBotAdmin) {
            await malvin.sendMessage(from, { text: `Foreign numbers restricted.` });
            await malvin.groupParticipantsUpdate(from, [sender], "remove");
            return;
          }
        }

        // Anti-Bad-Word
        if (config.ANTI_BAD_WORD === 'true') {
          const badWords = (config.BAD_WORDS || "").toLowerCase().split(',').map(w => w.trim());
          if (badWords.length > 0 && badWords.some(w => body.toLowerCase().includes(w)) && isBotAdmin) {
            await malvin.sendMessage(from, { delete: mek.key });
            await malvin.sendMessage(from, { text: `@${senderNumber} Bad word detected!`, mentions: [sender] });
            return;
          }
        }
      }

      if (!body.trim()) {
        if (config.AUTO_REACT === 'true') {
          let emojis = config.CUSTOM_REACT_EMOJIS ? config.CUSTOM_REACT_EMOJIS.split(',').map(e => e.trim()) : 
                       ['❤️','🔥','👍','😄','🎉','😍','😂','🤩','🙌','👏','🥰','🤗','💯','🚀','✨'];
          await malvin.sendMessage(from, { react: { text: getRandom(emojis), key: mek.key } });
        }
        return;
      }

      let prefix = config.PREFIX;
      if (!body.startsWith(prefix)) {
        if (config.AUTO_REPLY === 'true' && !isGroup) {
          await malvin.sendMessage(from, { text: 'Hello! I am online.' });
        }
        return;
      }

      const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(' ');

      // === HARD CODED TEST COMMAND (REMOVE AFTER TESTING) ===
      if (command === "test" || command === "ping") {
        await malvin.sendMessage(from, {
          text: "✅ *Bot is alive and fully working!*\n\n" +
                `Prefix: ${prefix}\n` +
                `Mode: ${config.MODE}\n` +
                `Owner: ${senderNumber === botNumber ? "You are the owner!" : "Not owner"}\n` +
                `Time: ${moment().format('HH:mm:ss')}`
        }, { quoted: mek });
        return;
      }
      // ===================================================

      const m = sms(malvin, mek);
      const events = require('./malvin');
      if (!events.commands || !Array.isArray(events.commands)) {
        console.log(chalk.yellow("[!] No commands registered from plugins"));
        return;
      }

      let cmd = events.commands.find(c => c.pattern === command || (c.alias && c.alias.includes(command)));
      if (!cmd) {
        await malvin.sendMessage(from, { text: `❌ Command "${command}" not found.` }, { quoted: mek });
        return;
      }

      if (cmd.react) {
        await malvin.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
      }

      const reply = (text) => malvin.sendMessage(from, { text: `${text}\n\n*NI MBAYA 😅*` }, { quoted: mek });

      const tools = {
        from, quoted: mek, body, isCmd: true, command, args, q, text: body, isGroup,
        sender, senderNumber, botNumber, pushname: mek.pushName || 'User',
        isMe: senderNumber === botNumber, isOwner: isRealOwner, reply
      };

      await cmd.function(malvin, mek, m, tools);

    } catch (error) {
      console.error('Message handler error:', error);
    }
  });
}

// Express
app.use(express.static(path.join(__dirname, "lib")));
app.get("/", (req, res) => res.redirect("/marisel.html"));

app.listen(port, () => {
  console.log(chalk.cyan(`\n╭──[ hello user ]─\n│🤗 hi your bot is live \n╰──────────────`));
});

setTimeout(() => connectToWA(), 4000);
