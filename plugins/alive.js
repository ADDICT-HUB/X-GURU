const { malvin } = require("../malvin");
const config = require("../settings");
const os = require("os");
const { runtime } = require('../lib/functions');
const moment = require("moment-timezone");

// Fixed image URL
const ALIVE_IMG = "https://url.bwmxmd.online/Adams.xm472dqv.jpeg";

malvin({
    pattern: "alive2",
    desc: "Check X GURU bot's status & uptime",
    category: "main",
    react: "🔥",
    filename: __filename
}, async (malvin, mek, m, { reply, from }) => {
    try {
        const pushname = m.pushName || "User";
        const timezone = config.TIMEZONE || "Africa/Nairobi";
        const now = moment.tz(timezone);
        const currentTime = now.format("HH:mm:ss");
        const currentDate = now.format("dddd, MMMM Do YYYY");

        const uptime = runtime(process.uptime());

        const toTinyCap = (text) =>
            text.split("").map(char => {
                const tiny = {
                    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ',
                    h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ',
                    o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ',
                    v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
                };
                return tiny[char.toLowerCase()] || char;
            }).join("");

        const msg = `
╔═══════════════════════════╗
║       🔥 X GURU IS ALIVE 🔥       ║
╠═══════════════════════════╣
║ 👤 User       : @${m.sender.split("@")[0]}
║ 🕐 Time       : ${currentTime}
║ 📅 Date       : ${currentDate}
║ ⏱️ Uptime     : ${uptime}
║ ⚙️ Mode       : ${config.MODE.toUpperCase()}
║ 🔢 Prefix     : [ ${config.PREFIX || "."} ]
║ 👑 Owner      : GuruTech
║ 🔰 Version    : ${config.version || "2.0.0"}
╚═══════════════════════════╝

> ${toTinyCap("X GURU is online and ready to serve! Made with ❤️ by GuruTech")}`;

        await malvin.sendMessage(from, {
            image: { url: ALIVE_IMG },
            caption: msg,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.NEWSLETTER_JID || '120363421164015033@newsletter',
                    newsletterName: 'GuruTech',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error("Error in .alive2:", err);
        return reply(`❌ *Alive Command Error:*\n${err.message}`);
    }
});
