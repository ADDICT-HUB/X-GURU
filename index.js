// Anti-crash handler
process.on("uncaughtException", (err) => {
  console.error("[❗] Uncaught Exception:", err.stack || err);
});

process.on("unhandledRejection", (reason, p) => {
  console.error("[❗] Unhandled Promise Rejection:", reason);
});

// Marisel

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

    if (config.SESSION_ID.startsWith("Mercedes~")) {
      console.log(chalk.yellow("[ ⏳ ] Decoding base64 session..."));
      const base64Data = config.SESSION_ID.replace("Mercedes~", "");
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
      throw new Error("Invalid SESSION_ID format. Use 'Mercedes~' prefix");
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
    console.log(chalk.yellow("Enter this code in WhatsApp > Settings > Linked Devices > Link a Device"));
  } catch (err) {
    console.error(chalk.red("Error getting pairing code:", err.message));
    process.exit(1);
  }
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
      console.log(chalk.green("[ 🤖 ] Mercedes Connected ✅"));

      // Load plugins
      const pluginPath = path.join(__dirname, "plugins");
      try {
        fsSync.readdirSync(pluginPath).forEach((plugin) => {
          if (path.extname(plugin).toLowerCase() === ".js") {
            require(path.join(pluginPath, plugin));
          }
        });
        console.log(chalk.green("[ ✅ ] Plugins loaded successfully"));
      } catch (err) {
        console.error(chalk.red("[ ❌ ] Error loading plugins:", err.message));
      }

      // Send connection message
      try {
        await sleep(2000);
        const jid = malvin.decodeJid(malvin.user.id);
        if (!jid) throw new Error("Invalid JID for bot");

        const prefix = getPrefix();

        const currentDate = new Date();
        const date = currentDate.toLocaleDateString();
        const time = currentDate.toLocaleTimeString();
        const uptime = runtime(process.uptime());

        const upMessage = `
*┏──〔 Mercedes Connected 〕───⊷*   
*┇ Prefix: ${prefix}*
*┇ Date: ${date}*
*┇ Time: ${time}*
*┇ Uptime: ${uptime}*
*┇ Owner: ᴍᴀʀɪsᴇʟ*
*┇ Channel:* https://shorturl.at/DYEi0
*┗──────────────⊷*
> *Bot is now online and ready!*`;

        const startupImage = "https://files.catbox.moe/atpgij.jpg";
        const welcomeAudio = "https://files.catbox.moe/vkvci3.mp3"; // Working audio

        // Send image + caption
        await malvin.sendMessage(jid, {
          image: { url: startupImage },
          caption: upMessage,
        });
        console.log(chalk.green("[ 📩 ] Connection notice sent with image"));

        // Send audio
        await malvin.sendMessage(jid, {
          audio: { url: welcomeAudio },
          mimetype: "audio/mp4",
          ptt: true,
        });
        console.log(chalk.green("[ 📩 ] Startup audio sent"));
      } catch (err) {
        console.error(chalk.red("[ 🔴 ] Failed to send startup message:"), err.message);
      }

      // Follow only your main newsletter
      const newsletterJid = "120363421164015033@newsletter";
      try {
        const metadata = await malvin.newsletterMetadata("jid", newsletterJid);
        if (!metadata.viewer_metadata) {
          await malvin.newsletterFollow(newsletterJid);
          console.log(chalk.green(`[ ✅ ] Followed newsletter: ${newsletterJid}`));
        } else {
          console.log(chalk.yellow(`[ 📌 ] Already following: ${newsletterJid}`));
        }
      } catch (err) {
        console.log(chalk.yellow(`[ ⚠️ ] Newsletter follow skipped (optional): ${err.message}`));
      }
    }

    if (qr && !pairingCode) {
      console.log(chalk.red("[ 🟢 ] Scan the QR code to connect or use --pairing-code"));
      qrcode.generate(qr, { small: true });
    }
  });

  malvin.ev.on("creds.update", saveCreds);

  // Anti-delete
  malvin.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null && config.ANTI_DELETE === 'true') {
        await AntiDelete(malvin, updates);
      }
    }
  });

  // Anti-call
  malvin.ev.on('call', async (calls) => {
    if (config.ANTI_CALL !== 'true') return;
    for (const call of calls) {
      if (call.status !== 'offer') continue;
      await malvin.rejectCall(call.id, call.from);
      await malvin.sendMessage(call.from, { text: config.REJECT_MSG || '*Busy, call later*' });
    }
  });

  // Welcome & Goodbye
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

  // Presence & activity
  malvin.ev.on('presence.update', async (update) => {
    await PresenceControl(malvin, update);
  });

  BotActivityFilter(malvin);

  // Message handler (your full message.upsert code goes here — keep it exactly as you had)
  malvin.ev.on('messages.upsert', async (messageData) => {
    // ... (your existing messages.upsert code from before — keep it unchanged)
    // It includes auto-react, command handling, anti-spam, etc.
    // I'm not repeating it here to save space, but keep your full version
  });

  // Helper functions (decodeJid, copyNForward, etc. — keep all your existing ones)
  malvin.decodeJid = jid => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
    } else return jid;
  };

  // ... (keep all your other helper functions: copyNForward, downloadMedia, sendFileUrl, etc.)
}

// Express
app.use(express.static(path.join(__dirname, "lib")));
app.get("/", (req, res) => res.redirect("/marisel.html"));

app.listen(port, () => {
  console.log(chalk.cyan(`
╭──[ hello user ]─
│🤗 hi your bot is live 
╰──────────────`));
});

setTimeout(() => connectToWA(), 4000);
