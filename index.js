// Anti-crash handler
process.on("uncaughtException", (err) => {
  console.error("[❗] Uncaught Exception:", err.stack || err);
});

process.on("unhandledRejection", (reason, p) => {
  console.error("[❗] Unhandled Promise Rejection:", reason);
});

// X GURU - Dynamic Owner (Person who linked the bot)

const axios = require("axios");
const config = require("./settings");
const os = require("os");
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

const fsSync = require("fs");
const fs = require("fs").promises;
const P = require("pino");
const chalk = require("chalk");
const path = require("path");
const { getPrefix } = require("./lib/prefix");
const readline = require("readline");

// Dynamic owner - set when connected
let linkedOwnerNumber = null;

// Temp directory
const tempDir = path.join(os.tmpdir(), "cache-temp");
if (!fsSync.existsSync(tempDir)) {
  fsSync.mkdirSync(tempDir);
}

const clearTempDir = () => {
  fsSync.readdir(tempDir, (err, files) => {
    if (err) return;
    for (const file of files) {
      fsSync.unlink(path.join(tempDir, file), () => {});
    }
  });
};
setInterval(clearTempDir, 5 * 60 * 1000);

// Express
const express = require("express");
const app = express();
const port = process.env.PORT || 7860;

// Session
let malvin;

const sessionDir = path.join(__dirname, "./sessions");
const credsPath = path.join(sessionDir, "creds.json");

if (!fsSync.existsSync(sessionDir)) {
  fsSync.mkdirSync(sessionDir, { recursive: true });
}

async function loadSession() {
  try {
    if (!config.SESSION_ID) return null;
    if (config.SESSION_ID.startsWith("Mercedes~")) {
      console.log(chalk.yellow("[ ⏳ ] Decoding base64 session..."));
      const base64Data = config.SESSION_ID.replace("Mercedes~", "");
      if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) throw new Error("Invalid base64");
      const decodedData = Buffer.from(base64Data, "base64");
      fsSync.writeFileSync(credsPath, decodedData);
      console.log(chalk.green("[ ✅ ] Base64 session saved"));
      return JSON.parse(decodedData.toString("utf-8"));
    }
  } catch (error) {
    console.error(chalk.red("Session error:"), error.message);
    return null;
  }
}

async function connectToWA() {
  console.log(chalk.cyan("[ 🟠 ] Connecting to WhatsApp..."));

  const creds = await loadSession();
  const { state, saveCreds } = await useMultiFileAuthState("./sessions", { creds });

  const { version } = await fetchLatestBaileysVersion();

  malvin = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    browser: Browsers.macOS("Firefox"),
    syncFullHistory: false,
    auth: state,
    version,
    getMessage: async () => ({}),
  });

  // Prevent duplicates
  malvin.ev.removeAllListeners('messages.upsert');
  malvin.ev.removeAllListeners('group-participants.update');
  malvin.ev.removeAllListeners('call');

  malvin.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.red("[ 🛑 ] Logged out"));
        process.exit(1);
      } else {
        console.log(chalk.red("[ ⏳️ ] Reconnecting..."));
        setTimeout(connectToWA, 5000);
      }
    } else if (connection === "open") {
      console.log(chalk.green("[ 🤖 ] X GURU Connected ✅"));

      // Set dynamic owner
      linkedOwnerNumber = malvin.user.id.split(':')[0];
      console.log(chalk.green(`[ 👤 ] Owner: ${linkedOwnerNumber} (linked number)`));

      // Load plugins
      const pluginPath = path.join(__dirname, "plugins");
      try {
        fsSync.readdirSync(pluginPath).forEach((plugin) => {
          if (path.extname(plugin).toLowerCase() === ".js") {
            require(path.join(pluginPath, plugin));
          }
        });
        console.log(chalk.green("[ ✅ ] Plugins loaded"));
      } catch (err) {
        console.error(chalk.red("[ ❌ ] Plugin error:"), err.message);
      }

      // Startup message
      try {
        await sleep(2000);
        const jid = malvin.user.id; // Use raw ID

        const prefix = getPrefix();
        const uptime = runtime(process.uptime());

        const upMessage = `
╔══════════════════════════╗
║        🔥 X GURU ONLINE 🔥        ║
╠══════════════════════════╣
║ Bot Name     : X GURU            ║
║ Prefix       : ${prefix.padEnd(18)}║
║ Uptime       : ${uptime.padEnd(18)}║
║ Owner        : You (Linked)      ║
║ Repo         : github.com/ADDICT-HUB/X-GURU ║
╚══════════════════════════╝

> X GURU is now active!`;

        await malvin.sendMessage(jid, {
          image: { url: "https://files.catbox.moe/atpgij.jpg" },
          caption: upMessage,
        });
        console.log(chalk.green("[ 📩 ] Startup sent"));
      } catch (err) {
        console.error(chalk.red("Startup failed:"), err.message);
      }
    }

    if (qr) {
      console.log(chalk.red("[ 🟢 ] Scan QR"));
      qrcode.generate(qr, { small: true });
    }
  });

  malvin.ev.on("creds.update", saveCreds);

  // Anti-call
  malvin.ev.on('call', async (calls) => {
    if (config.ANTI_CALL !== 'true') return;
    for (const call of calls) {
      if (call.status !== 'offer') continue;
      await malvin.rejectCall(call.id, call.from);
      await malvin.sendMessage(call.from, { text: config.REJECT_MSG || '*Call rejected*' });
    }
  });

  // Group participants (safe)
  malvin.ev.on('group-participants.update', async (update) => {
    const { id, participants, action } = update;
    for (let participant of participants) {
      if (typeof participant !== 'string') continue;
      const num = participant.split('@')[0];
      if (action === 'add' && config.WELCOME === 'true') {
        await malvin.sendMessage(id, { text: `Welcome @${num}! 👋`, mentions: [participant] });
      } else if (action === 'remove' && config.GOODBYE === 'true') {
        await malvin.sendMessage(id, { text: `Goodbye @${num} 👋`, mentions: [participant] });
      }
    }
  });

  // MESSAGE HANDLER - LINKED OWNER ALWAYS RESPONDS
  malvin.ev.on('messages.upsert', async (messageData) => {
    try {
      if (!messageData.messages?.length) return;
      const mek = messageData.messages[0];
      if (!mek.message) return;

      const from = mek.key.remoteJid;
      const sender = mek.key.participant || mek.key.remoteJid;
      const senderNumber = sender.split('@')[0];
      const botNumber = malvin.user.id.split(':')[0];
      const isGroup = from.endsWith('@g.us');

      const isLinkedOwner = linkedOwnerNumber && senderNumber === linkedOwnerNumber;

      if (!isLinkedOwner) {
        if (config.MODE === "private") return;
        if (config.MODE === "inbox" && isGroup) return;
        if (config.MODE === "groups" && !isGroup) return;
      }

      if (!isGroup && !isLinkedOwner && config.PM_BLOCKER === 'true') {
        try {
          await malvin.updateBlockStatus(from, 'block');
        } catch (e) {}
        return;
      }

      if (config.READ_MESSAGE === 'true') {
        await malvin.readMessages([mek.key]);
      }

      const type = getContentType(mek.message);
      let body = type === 'conversation' ? mek.message.conversation :
                 type === 'extendedTextMessage' ? mek.message.extendedTextMessage.text :
                 (mek.message[type]?.caption || '');

      if (!body.trim()) return;

      const prefix = getPrefix();
      if (!body.startsWith(prefix)) return;

      const command = body.slice(prefix.length).trim().split(' ')[0].toLowerCase();
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(' ');

      const events = require('./malvin');
      if (!events.commands?.length) return;

      let cmd = events.commands.find(c => c.pattern === command || (c.alias && c.alias.includes(command)));
      if (!cmd) {
        await malvin.sendMessage(from, { text: `❌ Command "${command}" not found.` }, { quoted: mek });
        return;
      }

      if (cmd.react) {
        await malvin.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
      }

      const reply = (text) => malvin.sendMessage(from, { text }, { quoted: mek });

      const tools = {
        from, quoted: mek, body, isCmd: true, command, args, q, text: body, isGroup,
        sender, senderNumber, botNumber, pushname: mek.pushName || 'User',
        isOwner: isLinkedOwner, reply
      };

      await cmd.function(malvin, mek, tools);

    } catch (error) {
      console.error('Handler error:', error);
    }
  });
}

// Express
app.use(express.static(path.join(__dirname, "lib")));
app.get("/", (req, res) => res.redirect("/marisel.html"));

app.listen(port, () => {
  console.log(chalk.cyan(`
╭──[ X GURU LIVE ]─
│🤖 Bot running
╰──────────────`));
});

setTimeout(() => connectToWA(), 4000);
