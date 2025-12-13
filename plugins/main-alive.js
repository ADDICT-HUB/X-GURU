const { malvin } = require("../malvin");
const config = require("../settings");
const moment = require("moment-timezone");
const os = require("os");
const { runtime } = require("../lib/functions");

const botStartTime = Date.now();
const ALIVE_IMG = config.ALIVE_IMAGE || 'https://files.catbox.moe/75baia.jpg';
const NEWSLETTER_JID = config.NEWSLETTER_JID || '120363421164015033@newsletter';
const AUDIO_URL = config.AUDIO_URL || 'https://files.catbox.moe/jlf4l2.mp3';

// Tiny caps mapping for lowercase letters
const tinyCapsMap = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
  j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'q', r: 'ʀ',
  s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};

// Function to convert string to tiny caps
const toTinyCaps = (str) => str.split('').map(c => tinyCapsMap[c.toLowerCase()] || c).join('');

malvin({
  pattern: 'alive',
  alias: ['uptime', 'runtime', 'test'],
  desc: 'Check if the bot is active.',
  category: 'info',
  react: '🚀',
  filename: __filename,
}, async (malvin, mek, m, { reply, from, pushname }) => {
  try {
    const uptime = runtime(process.uptime());
    const usedRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);

    const caption = `
╭───〔 𝗫-𝗚𝗨𝗥𝗨 𝗦𝗧𝗔𝗧𝗨𝗦 〕───
│ 👤 User       : ${pushname}
│ 🕓 Uptime     : ${uptime}
│ 💻 Bot Name   : ${config.BOT_NAME || 'X-GURU'}
│ 🧑‍💻 Owner    : ${config.OWNER_NAME || 'GuruTech'}
│ 🖥 RAM Usage  : ${usedRam}MB / ${totalRam}MB
╰────────────────────────────
`.trim();

    const buttons = [
      {
        buttonId: "action",
        buttonText: { displayText: "MENU OPTIONS" },
        type: 4,
        nativeFlowInfo: {
          name: "single_select",
          paramsJson: JSON.stringify({
            title: "Click Here",
            sections: [
              {
                title: "X-GURU MENU",
                rows: [
                  { title: "MENU", description: "Open all commands", id: `${config.PREFIX}menu` },
                  { title: "OWNER", description: "Contact bot owner", id: `${config.PREFIX}owner` },
                  { title: "PING", description: "Check bot speed", id: `${config.PREFIX}ping` },
                  { title: "SYSTEM", description: "System information", id: `${config.PREFIX}system` },
                  { title: "REPO", description: "GitHub repository", id: `${config.PREFIX}repo` },
                ]
              }
            ]
          })
        }
      }
    ];

    await malvin.sendMessage(from, {
      buttons,
      headerType: 1,
      image: { url: ALIVE_IMG },
      caption,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_JID,
          newsletterName: toTinyCaps(config.OWNER_NAME || 'GuruTech'),
          serverMessageId: 143,
        },
      },
    }, { quoted: mek });

    // Send audio if configured
    if (AUDIO_URL) {
      await malvin.sendMessage(from, {
        audio: { url: AUDIO_URL },
        mimetype: 'audio/mp4',
        ptt: true,
      }, { quoted: mek });
    }

  } catch (error) {
    console.error('❌ Error in alive command:', error.message);
    await malvin.sendMessage(from, { react: { text: "❌", key: mek.key } });
    const errorMessage = toTinyCaps(`
      An error occurred while processing the alive command.
      Error Details: ${error.message}
    `).trim();
    return reply(errorMessage);
  }
});
