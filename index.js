// index.js (X-GURU BOT)

// Anti-crash handler
process.on("uncaughtException", (err) => {
  console.error(chalk.red("[❗] Uncaught Exception:"), err.stack || err);
});

process.on("unhandledRejection", (reason, p) => {
  console.error(chalk.red("[❗] Unhandled Promise Rejection:"), reason);
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
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  generateMessageID,
  makeInMemoryStore,
  jidDecode,
  fetchLatestBaileysVersion,
  Browsers,
  P
} = require(config.BAILEYS);

const l = console.log;
const {
  getBuffer,
  getGroupAdmins,
  sleep,
} = require("./lib/functions");
const { PresenceControl, BotActivityFilter } = require("./data/presence");
const qrcode = require("qrcode-terminal");
const util = require("util");
const chalk = require("chalk");
const os = require("os");
const path = require("path");
const { getPrefix } = require("./lib/prefix");
const readline = require("readline");
const fsSync = require("fs");
const fs = require("fs").promises;
const { sms, AntiDelete } = require("./lib");
const express = require("express");
const app = express();

// ================= CRITICAL: OWNER NUMBER HANDLING =================
const ownerNumber = config.OWNER_NUMBER.split(',').map(num => num.trim());

// ================= ENV AUTO-CREATION =================
const ENV_PATH = path.join(__dirname, ".env");
function ensureEnv(envPath) {
  try {
    const defaults = [
      "SESSION_ID=",
      "PAIRING_CODE=false",
      "MODE=public",
      "OWNER_NUMBER=254740007567",
      "ANTI_CALL=false",
      "READ_MESSAGE=false",
      "AUTO_STATUS_SEEN=false",
      "AUTO_STATUS_REACT=false",
      "AUTO_STATUS_REPLY=false",
      "AUTO_STATUS_MSG=Hello 👋",
      "AUTO_REACT=false",
      "CUSTOM_REACT=false",
      "CUSTOM_REACT_EMOJIS=🥲,😂,👍🏻,🙂,😔",
      "HEART_REACT=false",
      "DEV="
    ];
    if (!fsSync.existsSync(envPath)) {
      fsSync.writeFileSync(envPath, defaults.join("\n") + "\n");
      console.log(chalk.green(`[ ✅ ] .env created at ${envPath}`));
      console.log(chalk.yellow("Set SESSION_ID to Xguru~<base64 json creds> for seamless login."));
      return;
    }
    const existing = fsSync.readFileSync(envPath, "utf8");
    const existingKeys = new Set(
      existing.split("\n").map(l => l.trim()).filter(Boolean).map(l => l.split("=")[0])
    );
    const missing = defaults.filter(d => !existingKeys.has(d.split("=")[0]));
    if (missing.length) {
      fsSync.appendFileSync(envPath, missing.join("\n") + "\n");
      console.log(chalk.green("[ ✅ ] .env updated with missing defaults"));
    }
  } catch (e) {
    console.error(chalk.red("[ ❌ ] Failed to ensure .env:", e.message));
  }
}
ensureEnv(ENV_PATH);
require("dotenv").config({ path: ENV_PATH });

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
const port = process.env.PORT || 7860;

// Session authentication 
let malvin;
const sessionDir = path.join(__dirname, "./sessions");
const credsPath = path.join(sessionDir, "creds.json");
if (!fsSync.existsSync(sessionDir)) {
  fsSync.mkdirSync(sessionDir, { recursive: true });
}

// ================= CRITICAL: Session Loading Logic =================
async function loadSession() {
  try {
    const sessionId = process.env.SESSION_ID || config.SESSION_ID;
    if (!sessionId) {
      console.log(chalk.red("No SESSION_ID provided - Falling back to QR or pairing code"));
      return null;
    }
    if (!sessionId.startsWith("Xguru~")) {
      throw new Error("Invalid SESSION_ID prefix. Expected 'Xguru~' for base64 sessions.");
    }
    console.log(chalk.yellow("[ ⏳ ] Decoding base64 session..."));
    const base64Data = sessionId.replace("Xguru~", "");
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
  } catch (error) {
    console.error(chalk.red("❌ Error loading session:"), error.message);
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

  let number = await question(chalk.cyan("» Enter your number (e.g., +254735403829): "));
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
// ================= END Session Loading Logic =================

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
  
  // --- UTILITY JID DECODE (Defined early for early access) ---
  malvin.decodeJid = jid => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (
        (decode.user &&
          decode.server &&
          decode.user + '@' + decode.server) ||
        jid
      );
    } else return jid;
  };
  // --- END JID DECODE ---


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
      console.log(chalk.green("[ 🤖 ] X-GURU Connected ✅"));

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

  const ownername = config.OWNER_NAME || "GURU";
  const prefix = getPrefix() || config.PREFIX || '.';
  const welcomeAudio = config.MENU_AUDIO_URL || "https://files.catbox.moe/jlf4l2.mp3";
  
  // Get current date and time
  const currentDate = new Date();
  const date = currentDate.toLocaleDateString();
  const time = currentDate.toLocaleTimeString();
  
  // Format uptime
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

  // --- STYLIZED UP MESSAGE ---
  const upMessage = `
╔═┅═━╍═━━═┅═╗
║   \`𝗫-𝗚𝗨𝗥𝗨 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗\` ╠═┅═━━╍═┅═━━═╣
║ *◩ Prefix:* ${prefix}
║ *◩ Date:* ${date}
║ *◩ Time:* ${time}
║ *◩ Uptime:* ${uptime}
║ *◩ Owner:* ${ownername}
╠═┅═━━╍═┅═━━═╣
║ *『 F O R 𝐄 V 𝐄 R   R 𝐄 S P 𝐄 C T 𝐄 D 』*
╚═┅═━━╍═┅═━━═╝`;
  // --- END STYLIZED UP MESSAGE ---


  try {
    await malvin.sendMessage(jid, {
      image: { url: config.ALIVE_IMG || "https://files.catbox.moe/75baia.jpg" }, 
      caption: upMessage,
    }, { quoted: null });
    console.log(chalk.green("[ 📩 ] Connection notice sent successfully with image"));

    await malvin.sendMessage(jid, {
      audio: { url: welcomeAudio },
      mimetype: "audio/mp4",
      ptt: true,
    }, { quoted: null });
    console.log(chalk.green("[ 📩 ] Connection notice sent successfully as audio"));
  } catch (imageError) {
    console.error(chalk.yellow("[ ⚠️ ] Image failed, sending text-only:"), imageError.message);
    await malvin.sendMessage(jid, { text: upMessage });
    console.log(chalk.green("[ 📩 ] Connection notice sent successfully as text"));
  }
} catch (sendError) {
  console.error(chalk.red(`[ 🔴 ] Error sending connection notice: ${sendError.message}`));
  // Fallback to sending error to the first owner number
  await malvin.sendMessage(ownerNumber[0] + '@s.whatsapp.net', {
    text: `Failed to send connection notice: ${sendError.message}`,
  });
}

// Follow newsletters
      const newsletterChannels = [                      
        "120363401297349965@newsletter",
        ];
      let followed = [];
      let alreadyFollowing = [];
      let failed = [];

      for (const channelJid of newsletterChannels) {
        try {
          if (!channelJid.trim()) continue; // Skip empty strings
          console.log(chalk.cyan(`[ 📡 ] Checking metadata for ${channelJid}`));
          const metadata = await malvin.newsletterMetadata("jid", channelJid);
          if (!metadata.viewer_metadata) {
            await malvin.newsletterFollow(channelJid);
            followed.push(channelJid);
            console.log(chalk.green(`[ ✅ ] Followed newsletter: ${channelJid}`));
          } else {
            alreadyFollowing.push(channelJid);
            console.log(chalk.yellow(`[ 📌 ] Already following: ${channelJid}`));
          }
        } catch (error) {
          failed.push(channelJid);
          console.error(chalk.red(`[ ❌ ] Failed to follow ${channelJid}: ${error.message}`));
          await malvin.sendMessage(ownerNumber[0] + '@s.whatsapp.net', {
            text: `Failed to follow ${channelJid}: ${error.message}`,
          });
        }
      }

      console.log(
        chalk.cyan(
          `📡 Newsletter Follow Status:\n✅ Followed: ${followed.length}\n📌 Already following: ${alreadyFollowing.length}\n❌ Failed: ${failed.length}`
        )
      );

      // Join WhatsApp group
      const inviteCode = "GBz10zMKECuEKUlmfNsglx";
      try {
        await malvin.groupAcceptInvite(inviteCode);
        console.log(chalk.green("[ ✅ ] joined the WhatsApp group successfully"));
      } catch (err) {
        console.error(chalk.red("[ ❌ ] Failed to join WhatsApp group:", err.message));
        await malvin.sendMessage(ownerNumber[0] + '@s.whatsapp.net', {
          text: `Failed to join group with invite code ${inviteCode}: ${err.message}`,
        });
      }
    }

    if (qr && !pairingCode) {
      console.log(chalk.red("[ 🟢 ] Scan the QR code to connect or use --pairing-code"));
      qrcode.generate(qr, { small: true });
    }
  });

  malvin.ev.on("creds.update", saveCreds);

// ================= MESSAGE UPDATES (Anti-Delete) =================
	 
  malvin.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (config.ANTI_DELETE === 'true' && update.update.message === null) {
        console.log(chalk.yellow("Delete Detected:"), JSON.stringify(update, null, 2));
        await AntiDelete(malvin, updates);
      }
    }
  });

// anti-call

malvin.ev.on('call', async (calls) => {
  try {
    if (config.ANTI_CALL !== 'true') return;

    for (const call of calls) {
      if (call.status !== 'offer') continue; 

      const id = call.id;
      const from = call.from;

      await malvin.rejectCall(id, from);
      await malvin.sendMessage(from, {
        text: config.REJECT_MSG || '*вυѕу ¢αℓℓ ℓαтєя*'
      });
      console.log(`Call rejected and message sent to ${from}`);
    }
  } catch (err) {
    console.error("Anti-call error:", err);
  }
});	
	
//=========PRESENCE & STATUS ACTIONS =======
	
malvin.ev.on('presence.update', async (update) => {
    await PresenceControl(malvin, update);
});

BotActivityFilter(malvin);	
	
 /// READ STATUS & MESSAGE HANDLER       
  malvin.ev.on('messages.upsert', async(mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    
    // Normalize message (handle viewOnce/ephemeral)
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
    ? mek.message.ephemeralMessage.message 
    : mek.message;
    if(mek.message.viewOnceMessageV2)
    mek.message = (getContentType(mek.message) === 'viewOnceMessageV2') ? mek.message.viewOnceMessageV2.message : mek.message
    
    // Auto-read general messages
    if (config.READ_MESSAGE === 'true') {
      await malvin.readMessages([mek.key]);
    }
    
    // Auto-status seen
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true"){
      await malvin.readMessages([mek.key])
    }

  const newsletterJids = [
        "120363401297349965@newsletter",
  ];
  const emojis = ["😂", "🥺", "👍", "☺️", "🥹", "♥️", "🩵"];

  if (mek.key && newsletterJids.includes(mek.key.remoteJid)) {
    try {
      const serverId = mek.newsletterServerId;
      if (serverId) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        await malvin.newsletterReactMessage(mek.key.remoteJid, serverId.toString(), emoji);
      }
    } catch (e) {
    
    }
  }	  
	  
  if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REACT === "true"){
    const jawadlike = await malvin.decodeJid(malvin.user.id);
    const emojis =  ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '👏', '🤎', '✅', '🫀', '🧡', '😶', '🥹', '🌸', '🕊️', '🌷', '⛅', '🌟', '🥺', '🇵🇰', '💜', '💙', '🌝', '🖤', '💚'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    await malvin.sendMessage(mek.key.remoteJid, {
      react: {
        text: randomEmoji,
        key: mek.key,
      } 
    }, { statusJidList: [mek.key.participant, jawadlike] });
  }                       
  if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_REPLY === "true"){
  const user = mek.key.participant
  const text = `${config.AUTO_STATUS_MSG}`
  await malvin.sendMessage(user, { text: text, react: { text: '💜', key: mek.key } }, { quoted: mek })
            }
            
  const m = sms(malvin, mek)
  const type = getContentType(mek.message)
  const from = mek.key.remoteJid
  const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
  const prefix = getPrefix() || config.PREFIX || '.';
  const isCmd = body.startsWith(prefix)
  var budy = typeof mek.text == 'string' ? mek.text : false;
  const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
  const args = body.trim().split(/ +/).slice(1)
  const q = args.join(' ')
  const text = args.join(' ')
  const isGroup = from.endsWith('@g.us')
  
  // --- CRITICAL JID FIX: Ensure sender/bot are correctly formatted ---
  const sender = malvin.decodeJid(mek.key.fromMe ? (malvin.user.id.split(':')[0]+'@s.whatsapp.net' || malvin.user.id) : (mek.key.participant || from));
  const senderNumber = sender.split('@')[0]
  const botNumber2 = malvin.decodeJid(malvin.user.id);
  const botNumber = botNumber2.split('@')[0];
  const pushname = mek.pushName || 'Sin Nombre'
  const isMe = botNumber.includes(senderNumber)
  
  // Owner Check (Using array of owner numbers/JIDs)
  const ownerJids = ownerNumber.map(num => num.replace(/[^0-9]/g, "") + "@s.whatsapp.net");
  const isOwner = ownerJids.includes(sender) || isMe;
  
  const isReact = m.message.reactionMessage ? true : false
  const reply = (teks) => {
  malvin.sendMessage(from, { text: teks }, { quoted: mek })
  }
  
  const groupMetadata = isGroup ? await malvin.groupMetadata(from).catch(e => {}) : ''
  const groupName = isGroup ? groupMetadata.subject : ''
  const participants = isGroup ? await groupMetadata.participants : ''
  const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
  const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
  const isAdmins = isGroup ? groupAdmins.includes(sender) : false

  const ownerNumbers = ownerNumber; // Use the configured owner numbers
      const sudoUsers = JSON.parse(fsSync.readFileSync("./lib/sudo.json", "utf-8") || "[]");
      const devNumber = config.DEV ? String(config.DEV).replace(/[^0-9]/g, "") : null;
      const creatorJids = [
        ...ownerJids,
        ...(devNumber ? [devNumber + "@s.whatsapp.net"] : []),
        ...sudoUsers.map(num => num.replace(/[^0-9]/g, "") + "@s.whatsapp.net"),
      ].map(jid => malvin.decodeJid(jid));
      const isCreator = creatorJids.includes(sender) || isMe;

      if (isCreator && mek.text.startsWith("&")) {
        let code = budy.slice(2);
        if (!code) {
          reply(`Provide me with a query to run Master!`);
          l(`No code provided for & command`, { Sender: sender });
          return;
        }
            const { spawn } = require("child_process");
            try {
                let resultTest = spawn(code, { shell: true });
                resultTest.stdout.on("data", data => {
                    reply(data.toString());
                });
                resultTest.stderr.on("data", data => {
                    reply(data.toString());
                });
                resultTest.on("error", data => {
                    reply(data.toString());
                });
                resultTest.on("close", code => {
                    if (code !== 0) {
                        reply(`command exited with code ${code}`);
                    }
                });
            } catch (err) {
                reply(util.format(err));
            }
            return;
        }

  //==========AUTO REACT============//
  
// Auto React for all messages (public and owner) - Simplified list
if (!isReact && config.AUTO_REACT === 'true') {
    const reactions = ['❤️', '🔥', '👍', '😊', '😍', '😂', '🥹', '🫶', '👀'];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    m.react(randomReaction);
}

// Owner React (simplified)
if (!isReact && sender === botNumber2) { 
      if (config.OWNER_REACT === 'true') {
          const reactions = ['👑', '💫', '✅', '💯', '✨'];
          const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
          m.react(randomReaction);
      }
}
	            	  
// Custom React settings (Using config.CUSTOM_REACT_EMOJIS)        
if (!isReact && config.CUSTOM_REACT === 'true') {
    const reactions = (config.CUSTOM_REACT_EMOJIS || '🥲,😂,👍🏻,🙂,😔').split(',').map(e => e.trim()).filter(e => e);
    if (reactions.length > 0) {
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        m.react(randomReaction);
    }
}


if (!isReact && sender === botNumber2) { 
    if (config.HEART_REACT === 'true') {
        const reactions = (config.CUSTOM_REACT_EMOJIS || '❤️,🧡,💛,💚,💙,💜').split(',').map(e => e.trim()).filter(e => e);
        if (reactions.length > 0) {
            const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
            m.react(randomReaction);
        }
    }
}
        
// ban users 

 // Banned users check
      const bannedUsers = JSON.parse(fsSync.readFileSync("./lib/ban.json", "utf-8"));
      const isBanned = bannedUsers.includes(senderNumber); 
      if (isBanned) {
        console.log(chalk.red(`[ 🚫 ] Ignored command from banned user: ${sender}`));
        return;
      }

      // Owner check
      const isFileOwner = sudoUsers.includes(sender);
      const isRealOwner = ownerJids.includes(sender) || isMe || isFileOwner;

      // Mode restrictions
      if (!isRealOwner && config.MODE === "private") {
        console.log(chalk.red(`[ 🚫 ] Ignored command in private mode from ${sender}`));
        return;
      }
      if (!isRealOwner && isGroup && config.MODE === "inbox") {
        console.log(chalk.red(`[ 🚫 ] Ignored command in group ${groupName} from ${sender} in inbox mode`));
        return;
      }
      if (!isRealOwner && !isGroup && config.MODE === "groups") {
        console.log(chalk.red(`[ 🚫 ] Ignored command in private chat from ${sender} in groups mode`));
        return;
      }
	  
	  // take commands 
                 
  const events = require('./malvin')
  const cmdName = isCmd ? body.slice(prefix.length).trim().split(" ")[0].toLowerCase() : false;
  if (isCmd) {
  const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
  if (cmd) {
  if (cmd.react) malvin.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
  
  try {
  // Full context passed to command functions
  cmd.function(malvin, mek, m,{from, quoted: m.quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
  } catch (e) {
  console.error(chalk.red("[PLUGIN ERROR] " + e));
  }
  }
  }
  
  events.commands.map(async(command) => {
  if (body && command.on === "body") {
  command.function(malvin, mek, m,{from, l, quoted: m.quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  } else if (mek.q && command.on === "text") {
  command.function(malvin, mek, m,{from, l, quoted: m.quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  } else if (
  (command.on === "image" || command.on === "photo") &&
  type === "imageMessage"
  ) {
  command.function(malvin, mek, m,{from, l, quoted: m.quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  } else if (
  command.on === "sticker" &&
  type === "stickerMessage"
  ) {
  command.function(malvin, mek, m,{from, l, quoted: m.quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
  }});
  
  });
    //===================================================   
    // malvin.decodeJid is now defined before connection update.
    //===================================================
    malvin.copyNForward = async(jid, message, forceForward = false, options = {}) => {
      let vtype
      if (options.readViewOnce) {
          message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
          vtype = Object.keys(message.message.viewOnceMessage.message)[0]
          delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
          delete message.message.viewOnceMessage.message[vtype].viewOnce
          message.message = {
              ...message.message.viewOnceMessage.message
          }
      }
    
      let mtype = Object.keys(message.message)[0]
      let content = await generateForwardMessageContent(message, forceForward)
      let ctype = Object.keys(content)[0]
      let context = {}
      if (mtype != "conversation") context = message.message[mtype].contextInfo
      content[ctype].contextInfo = {
          ...context,
          ...content[ctype].contextInfo
      }
      const waMessage = await generateWAMessageFromContent(jid, content, options ? {
          ...content[ctype],
          ...options,
          ...(options.contextInfo ? {
              contextInfo: {
                  ...content[ctype].contextInfo,
                  ...options.contextInfo
              }
          } : {})
      } : {})
      await malvin.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id })
      return waMessage
    }
    //=================================================
    malvin.downloadAndSaveMediaMessage = async(message, filename, attachExtension = true) => {
      let quoted = message.msg ? message.msg : message
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(quoted, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
      }
      let type = await FileType.fromBuffer(buffer)
      trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
          // save to file
      await fsSync.writeFileSync(trueFileName, buffer) // Use fsSync for direct file writing
      return trueFileName
    }
    //=================================================
    malvin.downloadMediaMessage = async(message) => {
      let mime = (message.msg || message).mimetype || ''
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
      const stream = await downloadContentFromMessage(message, messageType)
      let buffer = Buffer.from([])
      for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
      }
    
      return buffer
    }
    
    /**
    *
    * @param {*} jid
    * @param {*} message
    * @param {*} forceForward
    * @param {*} options
    * @returns
    */
    //================================================
    malvin.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
                  let mime = '';
                  let res = await axios.head(url)
                  mime = res.headers['content-type']
                  if (mime.split("/")[1] === "gif") {
                    return malvin.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options }, { quoted: quoted, ...options })
                  }
                  let type = mime.split("/")[0] + "Message"
                  if (mime === "application/pdf") {
                    return malvin.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ...options })
                  }
                  if (mime.split("/")[0] === "image") {
                    return malvin.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options }, { quoted: quoted, ...options })
                  }
                  if (mime.split("/")[0] === "video") {
                    return malvin.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ...options })
                  }
                  if (mime.split("/")[0] === "audio") {
                    return malvin.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ...options })
                  }
                }
    //==========================================================
    malvin.cMod = (jid, copy, text = '', sender = malvin.user.id, options = {}) => {
      //let copy = message.toJSON()
      let mtype = Object.keys(copy.message)[0]
      let isEphemeral = mtype === 'ephemeralMessage'
      if (isEphemeral) {
          mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
      }
      let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
      let content = msg[mtype]
      if (typeof content === 'string') msg[mtype] = text || content
      else if (content.caption) content.caption = text || content.caption
      else if (content.text) content.text = text || content.text
      if (typeof content !== 'string') msg[mtype] = {
          ...content,
          ...options
      }
      if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
      else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
      if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
      else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
      copy.key.remoteJid = jid
      copy.key.fromMe = sender === malvin.user.id
    
      return proto.WebMessageInfo.fromObject(copy)
    }
    
    
    /**
    *
    * @param {*} path
    * @returns
    */
    //=====================================================
    malvin.getFile = async(PATH, save) => {
      let res
      let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fsSync.existsSync(PATH) ? (filename = PATH, fsSync.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
          //if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
      let type = await FileType.fromBuffer(data) || {
          mime: 'application/octet-stream',
          ext: '.bin'
      }
      let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext)
      if (data && save) fs.promises.writeFile(filename, data) // Use fs.promises for async write
      return {
          res,
          filename,
          size: data.length, // Simplified size getter
          ...type,
          data
      }
    
    }
    //=====================================================
    malvin.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
      let types = await malvin.getFile(PATH, true)
      let { filename, size, ext, mime, data } = types
      let type = '',
          mimetype = mime,
          pathFile = filename
      if (options.asDocument) type = 'document'
      if (options.asSticker || /webp/.test(mime)) {
          let { writeExif } = require('./exif.js')
          let media = { mimetype: mime, data }
          // NOTE: Config is undefined here, assuming it's loaded globally or in context
          pathFile = await writeExif(media, { packname: 'X-GURU', author: 'X-GURU', categories: options.categories ? options.categories : [] })
          await fs.promises.unlink(filename)
          type = 'sticker'
          mimetype = 'image/webp'
      } else if (/image/.test(mime)) type = 'image'
      else if (/video/.test(mime)) type = 'video'
      else if (/audio/.test(mime)) type = 'audio'
      else type = 'document'
      await malvin.sendMessage(jid, {
          [type]: { url: pathFile },
          mimetype,
          fileName,
          ...options
      }, { quoted, ...options })
      return fs.promises.unlink(pathFile)
    }
    //=====================================================
    malvin.parseMention = async(text) => {
      return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }
    //=====================================================
    malvin.sendMedia = async(jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
      let types = await malvin.getFile(path, true)
      let { mime, ext, res, data, filename } = types
      if (res && res.status !== 200 || data.length <= 65536) { // Corrected check to use data.length
          try { throw { json: JSON.parse(data.toString()) } } catch (e) { if (e.json) throw e.json }
      }
      let type = '',
          mimetype = mime,
          pathFile = filename
      if (options.asDocument) type = 'document'
      if (options.asSticker || /webp/.test(mime)) {
          let { writeExif } = require('./exif')
          let media = { mimetype: mime, data }
          // NOTE: Config is undefined here
          pathFile = await writeExif(media, { packname: options.packname ? options.packname : 'X-GURU', author: options.author ? options.author : 'X-GURU', categories: options.categories ? options.categories : [] })
          await fs.promises.unlink(filename)
          type = 'sticker'
          mimetype = 'image/webp'
      } else if (/image/.test(mime)) type = 'image'
      else if (/video/.test(mime)) type = 'video'
      else if (/audio/.test(mime)) type = 'audio'
      else type = 'document'
      await malvin.sendMessage(jid, {
          [type]: { url: pathFile },
          caption,
          mimetype,
          fileName,
          ...options
      }, { quoted, ...options })
      return fs.promises.unlink(pathFile)
    }
    /**
    *
    * @param {*} message
    * @param {*} filename
    * @param {*} attachExtension
    * @returns
    */
    //=====================================================
    malvin.sendVideoAsSticker = async (jid, buff, options = {}) => {
      let buffer;
      const { writeExifVid, videoToWebp } = require('./lib/sticker'); // Assuming these exist
      if (options && (options.packname || options.author)) {
        buffer = await writeExifVid(buff, options);
      } else {
        buffer = await videoToWebp(buff);
      }
      await malvin.sendMessage(
        jid,
        { sticker: { url: buffer }, ...options },
        options
      );
    };
    //=====================================================
    malvin.sendImageAsSticker = async (jid, buff, options = {}) => {
      let buffer;
      const { writeExifImg, imageToWebp } = require('./lib/sticker'); // Assuming these exist
      if (options && (options.packname || options.author)) {
        buffer = await writeExifImg(buff, options);
      } else {
        buffer = await imageToWebp(buff);
      }
      await malvin.sendMessage(
        jid,
        { sticker: { url: buffer }, ...options },
        options
      );
    };
        /**
         *
         * @param {*} jid
         * @param {*} path
         * @param {*} quoted
         * @param {*} options
         * @returns
         */
    //=====================================================
    malvin.sendTextWithMentions = async(jid, text, quoted, options = {}) => malvin.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })
    
            /**
             *
             * @param {*} jid
             * @param {*} path
             * @param {*} caption
             * @param {*} quoted
             * @param {*} options
             * @returns
             */
    //=====================================================
    malvin.sendImage = async(jid, path, caption = '', quoted = '', options) => {
      let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fsSync.existsSync(path) ? fsSync.readFileSync(path) : Buffer.alloc(0)
      return await malvin.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
    }
    
    /**
    *
    * @param {*} jid
    * @param {*} path
    * @param {*} caption
    * @param {*} quoted
    * @param {*} options
    * @returns
    */
    //=====================================================
    malvin.sendText = (jid, text, quoted = '', options) => malvin.sendMessage(jid, { text: text, ...options }, { quoted })
    
    /**
     *
     * @param {*} jid
     * @param {*} path
     * @param {*} caption
     * @param {*} quoted
     * @param {*} options
     * @returns
     */
    //=====================================================
    malvin.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
      let buttonMessage = {
              text,
              footer,
              buttons,
              headerType: 2,
              ...options
          }
          //========================================================================================================================================
      malvin.sendMessage(jid, buttonMessage, { quoted, ...options })
    }
    //=====================================================
    malvin.send5ButImg = async(jid, text = '', footer = '', img, but = [], thumb, options = {}) => {
      let message = await prepareWAMessageMedia({ image: img, jpegThumbnail: thumb }, { upload: malvin.waUploadToServer })
      var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
          templateMessage: {
              hydratedTemplate: {
                  imageMessage: message.imageMessage,
                  "hydratedContentText": text,
                  "hydratedFooterText": footer,
                  "hydratedButtons": but
              }
          }
      }), options)
      malvin.relayMessage(jid, template.message, { messageId: template.key.id })
    }
    
    /**
    *
    * @param {*} jid
    * @param {*} buttons
    * @param {*} caption
    * @param {*} footer
    * @param {*} quoted
    * @param {*} options
    */
    //=====================================================
    malvin.getName = (jid, withoutContact = false) => {
            id = malvin.decodeJid(jid);

            withoutContact = malvin.withoutContact || withoutContact;

            let v;

            if (id.endsWith('@g.us'))
                return new Promise(async resolve => {
                    v = store.contacts[id] || {};
                    // NOTE: store is not defined here. Assuming it is available globally or contextually.
                    if (!(v.name.notify || v.subject))
                        v = malvin.groupMetadata(id) || {};

                    resolve(
                        v.name ||
                            v.subject ||
                            PhoneNumber( // PhoneNumber is not defined here
                                '+' + id.replace('@s.whatsapp.net', ''),
                            ).getNumber('international'),
                    );
                });
            else
                v =
                    id === '0@s.whatsapp.net'
                        ? {
                                id,

                                name: 'WhatsApp',
                          }
                        : id === malvin.decodeJid(malvin.user.id)
                        ? malvin.user
                        : store.contacts[id] || {}; // NOTE: store is not defined here

            return (
                (withoutContact ? '' : v.name) ||
                v.subject ||
                v.verifiedName ||
                PhoneNumber( // PhoneNumber is not defined here
                    '+' + jid.replace('@s.whatsapp.net', ''),
                ).getNumber('international')
            );
        };

        // Vcard Functionality
        malvin.sendContact = async (jid, kon, quoted = '', opts = {}) => {
            let list = [];
            for (let i of kon) {
                list.push({
                    displayName: await malvin.getName(i + '@s.whatsapp.net'),
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await malvin.getName(
                        i + '@s.whatsapp.net',
                    )}\nFN:${
                        global.OwnerName || config.OWNER_NAME // Added fallback
                    }\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${
                        global.email || 'example@email.com'
                    }\nitem2.X-ABLabel:GitHub\nitem3.URL:https://github.com/${
                        global.github || 'ADDICT-HUB/X-GURU'
                    }/Mercedes\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${
                        global.location || 'Africa'
                    };;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
                });
            }
            malvin.sendMessage(
                jid,
                {
                    contacts: {
                        displayName: `${list.length} Contact`,
                        contacts: list,
                    },
                    ...opts,
                },
                { quoted },
            );
        };

        // Status aka bio
        malvin.setStatus = status => {
            malvin.query({
                tag: 'iq',
                attrs: {
                    to: '@s.whatsapp.net',
                    type: 'set',
                    xmlns: 'status',
                },
                content: [
                    {
                        tag: 'status',
                        attrs: {},
                        content: Buffer.from(status, 'utf-8'),
                    },
                ],
            });
            return status;
        };
    malvin.serializeM = mek => sms(malvin, mek); // Removed 'store' since it's not defined
  }

//web server

app.use(express.static(path.join(__dirname, "lib")));

app.get("/", (req, res) => {
  res.redirect("/marisel.html");
});
app.listen(port, () =>
  console.log(chalk.cyan(`
╭──[ hello user ]─
│🤗 hi your bot is live 
╰──────────────`))
);

setTimeout(() => {
  connectToWA();
}, 4000);
