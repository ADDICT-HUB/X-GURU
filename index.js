// Anti-crash handler
process.on("uncaughtException", (err) => {
  console.error("[❗] Uncaught Exception:", err.stack || err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[❗] Unhandled Promise Rejection:", reason);
});

const axios = require("axios");
const config = require("./settings");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  getContentType,
  fetchLatestBaileysVersion,
  Browsers,
} = require(config.BAILEYS);

const { sleep } = require("./lib/functions");
const { sms, AntiDelete } = require("./lib");

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const qrcode = require("qrcode-terminal");
const P = require("pino");

let ownerNumber = []; // Dynamic owner (set after connect)
let malvin;

const sessionDir = path.join(__dirname, "sessions");
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

async function loadSession() {
  if (!config.SESSION_ID || !config.SESSION_ID.startsWith("Xguru~")) return null;
  try {
    console.log(chalk.yellow("[ ⏳ ] Decoding base64 session..."));
    const base64Data = config.SESSION_ID.replace("Xguru~", "");
    const decoded = Buffer.from(base64Data, "base64");
    fs.writeFileSync(path.join(sessionDir, "creds.json"), decoded);
    console.log(chalk.green("[ ✅ ] Session loaded successfully"));
    return JSON.parse(decoded.toString("utf-8"));
  } catch (err) {
    console.error(chalk.red("Session load error:"), err.message);
    return null;
  }
}

async function connectToWA() {
  console.log(chalk.cyan("[ 🟠 ] Connecting to WhatsApp..."));

  const creds = await loadSession();
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir, { creds });

  const { version } = await fetchLatestBaileysVersion();

  malvin = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
    version,
    browser: Browsers.macOS("Firefox"),
  });

  malvin.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) qrcode.generate(qr, { small: true });

    if (connection === "close") {
      const reconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (reconnect) setTimeout(connectToWA, 5000);
    }

    if (connection === "open") {
      console.log(chalk.green("[ 🤖 ] Xguru Connected ✅"));

      // Set owner to the linked number
      const linkedNumber = malvin.user.id.split(":")[0];
      ownerNumber = [linkedNumber];
      console.log(chalk.green(`[ 👑 ] Owner set to: ${linkedNumber}`));

      // Load plugins
      const pluginDir = path.join(__dirname, "plugins");
      let loaded = 0, failed = 0;
      if (fs.existsSync(pluginDir)) {
        fs.readdirSync(pluginDir).forEach((file) => {
          if (file.endsWith(".js")) {
            try {
              require(path.join(pluginDir, file));
              loaded++;
            } catch (e) {
              failed++;
              console.error(chalk.red(`Plugin ${file} failed`), e.message);
            }
          }
        });
      }
      console.log(chalk.green(`[ ✅ ] Plugins loaded: ${loaded} successful, ${failed} failed`));

      // === YOUR BEAUTIFUL STARTUP TABLE ===
      await sleep(2000);
      const jid = malvin.user.id;

      // Safe prefix loading
      let prefix = ".";
      try {
        const prefixHandler = require("./lib/prefix");
        if (typeof prefixHandler.getPrefix === "function") {
          prefix = prefixHandler.getPrefix();
        }
      } catch (err) {
        console.log(chalk.yellow("[!] Prefix load failed → using '.'"));
      }

      const now = new Date();
      const date = now.toLocaleDateString();
      const time = now.toLocaleTimeString();

      const formatUptime = (sec) => {
        const d = Math.floor(sec / 86400);
        sec %= 86400;
        const h = Math.floor(sec / 3600);
        sec %= 3600;
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${d}d ${h}h ${m}m ${s}s`;
      };

      const upMessage = `
▄▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▄
█        𝗫𝗚𝗨𝗥𝗨 𝗕𝗢𝗧 𝗢𝗡𝗟𝗜𝗡𝗘        █
█▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
█ • 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}
█ • 𝗗𝗮𝘁𝗲: ${date}
█ • 𝗧𝗶𝗺𝗲: ${time}
█ • 𝗨𝗽𝘁𝗶𝗺𝗲: ${formatUptime(process.uptime())}
█ • 𝗢𝘄𝗻𝗲𝗿: 𝗚𝗨𝗥𝗨
█ • 𝗖𝗵𝗮𝗻𝗻𝗲𝗹: https://shorturl.at/DYEi0
█
█ ⚡ 𝗥𝗲𝗽𝗼𝗿𝘁 𝗲𝗿𝗿𝗼𝗿𝘀 𝘁𝗼 𝗱𝗲𝘃𝗲𝗹𝗼𝗽𝗲𝗿
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`;

      await malvin.sendMessage(jid, { text: upMessage });
      console.log(chalk.green("[ 📩 ] Startup message sent"));

      try {
        await malvin.sendMessage(jid, {
          audio: { url: "https://files.catbox.moe/z47dgd.p3" },
          mimetype: "audio/mp4",
          ptt: true,
        });
        console.log(chalk.green("[ 🔊 ] Startup audio sent"));
      } catch (e) {
        console.log(chalk.yellow("[ ⚠️ ] Audio failed"));
      }

      // Join group
      try {
        await malvin.groupAcceptInvite("BEAT3drbrCJ4t29Flv0vwC");
        console.log(chalk.green("[ ✅ ] Joined support group"));
      } catch (e) {}
    }
  });

  malvin.ev.on("creds.update", saveCreds);

  malvin.ev.on("messages.update", async (updates) => {
    for (const u of updates) {
      if (u.update.message === null) await AntiDelete(malvin, updates);
    }
  });

  malvin.ev.on("call", async (calls) => {
    if (config.ANTI_CALL !== "true") return;
    for (const call of calls) {
      if (call.status === "offer") {
        await malvin.rejectCall(call.id, call.from);
        await malvin.sendMessage(call.from, { text: config.REJECT_MSG || "*Busy*" });
      }
    }
  });

  // Message handler
  malvin.ev.on("messages.upsert", async (messageData) => {
    try {
      const mek = messageData.messages[0];
      if (!mek.message || mek.key.fromMe) return;

      const from = mek.key.remoteJid;
      const sender = mek.key.participant || mek.key.remoteJid;
      const senderNumber = sender.split("@")[0];
      const botNumber = malvin.user.id.split(":")[0];

      const isGroup = from.endsWith("@g.us");

      // Owner check: linked number + sudo.json
      let isRealOwner = ownerNumber.includes(senderNumber) || senderNumber === botNumber;
      try {
        const sudo = JSON.parse(fs.readFileSync("./lib/sudo.json", "utf-8") || "[]");
        if (sudo.includes(senderNumber)) isRealOwner = true;
      } catch (e) {}

      // MODE restrictions
      if (config.MODE === "private" && !isRealOwner) return;
      if (config.MODE === "inbox" && isGroup && !isRealOwner) return;
      if (config.MODE === "groups" && !isGroup && !isRealOwner) return;

      // Ban check
      try {
        const ban = JSON.parse(fs.readFileSync("./lib/ban.json", "utf-8") || "[]");
        if (ban.includes(senderNumber)) return;
      } catch (e) {}

      // Get message body
      const type = getContentType(mek.message);
      let body = "";
      if (type === "conversation") body = mek.message.conversation;
      else if (type === "extendedTextMessage") body = mek.message.extendedTextMessage.text;
      else if (["imageMessage", "videoMessage", "documentMessage"].includes(type))
        body = mek.message[type]?.caption || "";

      // Auto-react for non-commands
      if (!body) {
        if (config.AUTO_REACT === "true") {
          const reacts = ["❤️", "🔥", "👍", "😄", "🎉"];
          await malvin.sendMessage(from, {
            react: { text: reacts[Math.floor(Math.random() * reacts.length)], key: mek.key },
          });
        }
        return;
      }

      // Get current prefix
      let prefix = ".";
      try {
        const ph = require("./lib/prefix");
        if (typeof ph.getPrefix === "function") prefix = ph.getPrefix();
      } catch (e) {}

      if (!body.startsWith(prefix)) return;

      const command = body.slice(prefix.length).trim().split(" ")[0].toLowerCase();
      const args = body.trim().split(/ +/).slice(1);
      const q = args.join(" ");

      const m = sms(malvin, mek);

      const events = require("./malvin");
      if (!events.commands || !Array.isArray(events.commands)) return;

      const cmd = events.commands.find(
        (c) => c.pattern === command || (c.alias && c.alias.includes(command))
      );

      if (!cmd) {
        await malvin.sendMessage(from, { text: `❌ Command "${command}" not found.` }, { quoted: mek });
        return;
      }

      if (cmd.react) {
        await malvin.sendMessage(from, { react: { text: cmd.react, key: mek.key } });
      }

      const reply = (text) => malvin.sendMessage(from, { text }, { quoted: mek });

      const tools = {
        from, quoted: mek, body, command, args, q, isGroup,
        sender, senderNumber, botNumber, pushname: mek.pushName || "User",
        isOwner: isRealOwner, reply,
      };

      await cmd.function(malvin, mek, m, tools);
    } catch (error) {
      console.error("Handler error:", error);
    }
  });
}

// Express server
const express = require("express");
const app = express();
const port = process.env.PORT || 7860;

app.use(express.static(path.join(__dirname, "lib")));
app.get("/", (req, res) => res.redirect("/marisel.html"));

app.listen(port, () => {
  console.log(chalk.cyan(`\n╭──[ Bot Live ]──\n│ Port: ${port}\n╰───────────────`));
});

setTimeout(connectToWA, 4000);
