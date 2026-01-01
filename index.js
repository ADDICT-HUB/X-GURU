// Anti-crash handler
process.on("uncaughtException", (err) => {
  console.error("[❗] Uncaught Exception:", err.stack || err);
});

process.on("unhandledRejection", (reason, p) => {
  console.error("[❗] Unhandled Promise Rejection:", reason);
});

// IT'S GuruTech 

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
const { fromBuffer } = require("file-type");
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
      console.log(chalk.yellow("[ ℹ️ ] No SESSION_ID provided - Will use QR code"));
      return null;
    }

    if (config.SESSION_ID.startsWith("Xguru~")) {
      console.log(chalk.yellow("[ ⏳ ] Loading session from environment..."));
      const base64Data = config.SESSION_ID.replace("Xguru~", "");
      
      if (!base64Data) {
        console.log(chalk.red("[ ❌ ] Empty session data"));
        return null;
      }

      try {
        // Decode base64
        const decodedData = Buffer.from(base64Data, "base64");
        const sessionData = JSON.parse(decodedData.toString("utf-8"));
        
        console.log(chalk.green(`[ ✅ ] Session loaded successfully`));
        console.log(chalk.cyan(`[ 📱 ] Account: ${sessionData.me?.name || 'Unknown'}`));
        console.log(chalk.cyan(`[ 🔐 ] Registered: ${sessionData.registered ? 'YES ✅' : 'NO ❌'}`));
        console.log(chalk.cyan(`[ 📏 ] Session size: ${base64Data.length} chars`));
        
        // CRITICAL: If session is not registered, don't use it
        if (!sessionData.registered) {
          console.log(chalk.red("[ ❌ ] Session not registered! Will use QR code instead."));
          return null;
        }
        
        // Convert Buffer strings back to Buffer objects
        function fixBuffers(obj) {
          if (!obj || typeof obj !== 'object') return obj;
          
          if (obj.type === "Buffer" && Array.isArray(obj.data)) {
            return Buffer.from(obj.data);
          }
          
          if (typeof obj === 'string' && obj.length > 50 && /^[A-Za-z0-9+/=]+$/.test(obj)) {
            return Buffer.from(obj, 'base64');
          }
          
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              obj[key] = fixBuffers(obj[key]);
            }
          }
          
          return obj;
        }
        
        const processedSession = fixBuffers(sessionData);
        return processedSession;
      } catch (parseError) {
        console.error(chalk.red("[ ❌ ] Failed to parse session data:"), parseError.message);
        return null;
      }
    } else {
      console.log(chalk.yellow("[ ⚠️ ] Invalid SESSION_ID format. Use 'Xguru~' prefix"));
      return null;
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

async function connectToWA() {
  console.log(chalk.cyan("[ 🟠 ] Connecting to WhatsApp ⏳️..."));

  const sessionLoaded = await loadSession();
  
  if (sessionLoaded) {
    console.log(chalk.green("[ ✅ ] Session loaded from environment"));
  } else {
    console.log(chalk.yellow("[ ⚠️ ] No valid session found, will use QR code"));
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir, {
    creds: sessionLoaded || undefined
  });

  // FIX: Hardcoded version to bypass 405 error from fetchLatestBaileysVersion()
  const version = [2, 3000, 1015901307]; 

  const pairingCode = config.PAIRING_CODE === "true" || process.argv.includes("--pairing-code");
  const useMobile = process.argv.includes("--mobile");

  malvin = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: !sessionLoaded && !pairingCode,
    // FIX: Using standard Chrome fingerprint instead of "XGURU"
    browser: ["Ubuntu", "Chrome", "120.0.6099.129"],
    syncFullHistory: false,
    keepAliveIntervalMs: 30000,
    auth: state,
    version,
    getMessage: async () => ({}),
    // FIX: Optimized retry logic for Heroku
    retryRequestDelayMs: 2000,
    maxRetries: 15,
    connectTimeoutMs: 60000,
  });

  if (pairingCode && !state.creds.registered) {
    await connectWithPairing(malvin, useMobile);
  }

  malvin.ev.on("connection.update", function(update) {
    var connection = update.connection;
    var lastDisconnect = update.lastDisconnect;
    var qr = update.qr;

    if (connection === "close") {
      var reason = null;
      if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output) {
        reason = lastDisconnect.error.output.statusCode;
      }
      
      if (!global.reconnectAttempts) global.reconnectAttempts = 0;
      global.reconnectAttempts++;
      
      console.log(chalk.red("[ 🔍 ] Disconnect code: " + (reason || 'unknown')));
      
      if (reason === DisconnectReason.loggedOut || reason === 405) {
        console.log(chalk.red("[ 🛑 ] Session invalid (Code 405). Please generate a NEW session ID."));
        if (fsSync.existsSync(credsPath)) {
          fsSync.unlinkSync(credsPath);
        }
        process.exit(1);
      } else {
        var delay = Math.min(5000 * Math.pow(2, Math.min(global.reconnectAttempts - 1, 4)), 60000);
        console.log(chalk.red("[ ⏳️ ] Connection lost, reconnecting in " + (delay/1000) + "s..."));
        setTimeout(connectToWA, delay);
      }
    } else if (connection === "open") {
      global.reconnectAttempts = 0;
      console.log(chalk.green("[ 🤖 ] XGURU Connected ✅"));
      
      var pluginPath = path.join(__dirname, "plugins");
      try {
        var plugins = fsSync.readdirSync(pluginPath);
        for (var i = 0; i < plugins.length; i++) {
          var plugin = plugins[i];
          if (path.extname(plugin).toLowerCase() === ".js") {
            require(path.join(pluginPath, plugin));
async function connectToWA() {
  console.log(chalk.cyan("[ 🟠 ] Connecting to WhatsApp ⏳️..."));

  const sessionLoaded = await loadSession();
  
  if (sessionLoaded) {
    console.log(chalk.green("[ ✅ ] Session loaded from environment"));
  } else {
    console.log(chalk.yellow("[ ⚠️ ] No valid session found, will use QR code"));
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir, {
    creds: sessionLoaded || undefined
  });

  // FIXED: Updated to most stable version [2, 3000, 1017531810] to bypass 405 error
  const version = [2, 3000, 1017531810]; 

  const pairingCode = config.PAIRING_CODE === "true" || process.argv.includes("--pairing-code");
  const useMobile = process.argv.includes("--mobile");

  malvin = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: !sessionLoaded && !pairingCode,
    // FIXED: Updated browser fingerprint to match newer WhatsApp Web standards
    browser: ["Ubuntu", "Chrome", "131.0.6778.205"],
    syncFullHistory: false,
    keepAliveIntervalMs: 30000,
    auth: state,
    version,
    getMessage: async () => ({}),
    // FIXED: Refined retry logic for Heroku stability
    retryRequestDelayMs: 5000,
    maxRetries: 20,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
  });

  if (pairingCode && !state.creds.registered) {
    await connectWithPairing(malvin, useMobile);
  }

  malvin.ev.on("connection.update", function(update) {
    var connection = update.connection;
    var lastDisconnect = update.lastDisconnect;
    var qr = update.qr;

    if (connection === "close") {
      var reason = null;
      if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output) {
        reason = lastDisconnect.error.output.statusCode;
      }
      
      if (!global.reconnectAttempts) global.reconnectAttempts = 0;
      global.reconnectAttempts++;
      
      console.log(chalk.red("[ 🔍 ] Disconnect code: " + (reason || 'unknown')));
      
      // Handle the critical 405/Logged Out state
      if (reason === DisconnectReason.loggedOut || reason === 405) {
        console.log(chalk.red("[ 🛑 ] Session invalid (Code 405). Please generate a NEW session ID."));
        if (fsSync.existsSync(credsPath)) {
          fsSync.unlinkSync(credsPath);
        }
        process.exit(1);
      } else {
        var delay = Math.min(5000 * Math.pow(2, Math.min(global.reconnectAttempts - 1, 4)), 60000);
        console.log(chalk.red("[ ⏳️ ] Connection lost, reconnecting in " + (delay/1000) + "s..."));
        setTimeout(connectToWA, delay);
      }
    } else if (connection === "open") {
      global.reconnectAttempts = 0;
      console.log(chalk.green("[ 🤖 ] XGURU Connected ✅"));
      
      var pluginPath = path.join(__dirname, "plugins");
      try {
        var plugins = fsSync.readdirSync(pluginPath);
        for (var i = 0; i < plugins.length; i++) {
          var plugin = plugins[i];
          if (path.extname(plugin).toLowerCase() === ".js") {
            require(path.join(pluginPath, plugin));
          }
        }
        console.log(chalk.green("[ ✅ ] Plugins loaded successfully"));
      } catch (err) {
        console.error(chalk.red("[ ❌ ] Error loading plugins: " + err.message));
      }

      // Connection Message
      try {
        var currentDate = new Date();
        var date = currentDate.toLocaleDateString();
        var time = currentDate.toLocaleTimeString();
        
        function formatUptime(seconds) {
          var days = Math.floor(seconds / (24 * 60 * 60));
          seconds %= 24 * 60 * 60;
          var hours = Math.floor(seconds / (60 * 60));
          seconds %= 60 * 60;
          var minutes = Math.floor(seconds / 60);
          seconds = Math.floor(seconds % 60);
          return days + "d " + hours + "h " + minutes + "m " + seconds + "s";
        }
        
        var uptime = formatUptime(process.uptime());
        var prefix = getPrefix();

        var upMessage = `╔═══════════════════════════\n║        X-GURU BOT\n╠═══════════════════════════\n║ 📅 Date    : ${date}\n║ ⏰ Time    : ${time}\n║ ⚡ Uptime  : ${uptime}\n║ 👑 Owner   : GuruTech\n║ 🎯 Prefix  : ${prefix}\n╠═══════════════════════════\n║ 📢 Channel:\n║ whatsapp.com/channel/\n║ 0029VaPFhgd07Zx92vmhXM1V\n╠═══════════════════════════\n║ > 🇰🇪 FOREVER RESPECTED \n╚═══════════════════════════`;

        var jid = malvin.decodeJid(malvin.user.id);
        malvin.sendMessage(jid, {
            image: { url: "https://files.catbox.moe/atpgij.jpg" },
            caption: upMessage,
        }).catch(() => malvin.sendMessage(jid, { text: upMessage }));
      } catch (error) {
        console.error(chalk.red("[ ❌ ] Error in connection message: " + error.message));
      }
    }

    if (qr && !pairingCode) {
      console.log(chalk.red("[ 🟢 ] Scan the QR code to connect"));
      qrcode.generate(qr, { small: true });
    }
  });

  malvin.ev.on("creds.update", saveCreds);
  // ... rest of the code continues normally
}
			  
  malvin.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null) {
        await AntiDelete(malvin, updates);
      }
    }
  });

  malvin.ev.on('call', async (calls) => {
    if (config.ANTI_CALL !== 'true') return;
    for (const call of calls) {
      if (call.status === 'offer') {
        await malvin.rejectCall(call.id, call.from);
        await malvin.sendMessage(call.from, { text: config.REJECT_MSG || '*вυѕу ¢αℓℓ ℓαтєя*' });
      }
    }
  });	
	
  malvin.ev.on('presence.update', async (update) => {
    await PresenceControl(malvin, update);
  });

  BotActivityFilter(malvin);	
	
  malvin.ev.on('messages.upsert', async(mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
    
    if (config.READ_MESSAGE === 'true') {
      await malvin.readMessages([mek.key]);
    }
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true"){
      await malvin.readMessages([mek.key])
    }

    // Auto-reply and react logic remains as provided...
    await saveMessage(mek);
    
    const m = sms(malvin, mek)
    const from = mek.key.remoteJid
    const body = (getContentType(mek.message) === 'conversation') ? mek.message.conversation : (getContentType(mek.message) === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : ''
    const prefix = getPrefix();
    const isCmd = body.startsWith(prefix)
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1)
    const q = args.join(' ')
    const text = q
    const isGroup = from.endsWith('@g.us')
    const sender = mek.key.fromMe ? (malvin.user.id.split(':')[0]+'@s.whatsapp.net') : (mek.key.participant || mek.key.remoteJid)
    const pushname = mek.pushName || 'Sin Nombre'
    const isMe = malvin.user.id.includes(sender.split('@')[0])
    
    const reply = (teks) => malvin.sendMessage(from, { text: teks }, { quoted: mek })
  
    // Command execution logic remains as provided...
    const events = require('./malvin')
    const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
    if (isCmd) {
      const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
      if (cmd) {
        if (cmd.react) malvin.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
        try {
          cmd.function(malvin, mek, m, {from, body, isCmd, command, args, q, text, isGroup, sender, pushname, isMe, reply});
        } catch (e) {
          console.error("[PLUGIN ERROR] " + e);
        }
      }
    }
  });

      // ... existing code ...
    malvin.decodeJid = jid => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        } else return jid;
    };
} // <--- This closes the connectToWA function

app.get("/", (req, res) => res.redirect("/marisel.html"));
app.listen(port, () => console.log(chalk.cyan("\n╭──[ hello user ]─\n│🤗 hi your bot is live \n╰──────────────")));

setTimeout(() => { connectToWA(); }, 4000);
