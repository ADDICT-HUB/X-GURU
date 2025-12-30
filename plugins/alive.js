const { malvin } = require("../malvin");
const config = require("../settings");
const os = require("os");
const { runtime } = require('../lib/functions');
const moment = require("moment");

const ALIVE_IMG = "hhttps://url.bwmxmd.online/Adams.xm472dqv.jpeg";

malvin({
    pattern: "alive2",
    desc: "Check bot's status & uptime",
    category: "main",
    react: "💡",
    filename: __filename
}, async (malvin, mek, m, { reply, from }) => {
    try {
        const pushname = m.pushName || "User";
        const now = moment();
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
╭──❖ 「 *${toTinyCap("Mercedes Status")}* 」 ❖─
│ 👤 ʜɪ: *${pushname}*
│ 🕓 ᴛɪᴍᴇ: *${currentTime}*
│ 📆 ᴅᴀᴛᴇ: *${currentDate}*
│ 🧭 ᴜᴘᴛɪᴍᴇ: *${uptime}*
│ ⚙️ ᴍᴏᴅᴇ: *${config.MODE}*
│ 🔰 ᴠᴇʀsɪᴏɴ: *${config.version}*
╰─────────❖
        `.trim();

        await malvin.sendMessage(from, {
            image: { url: ALIVE_IMG },
            caption: msg,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363299029326322@newsletter',
                    newsletterName: '𝖒𝖆𝖗𝖎𝖘𝖊𝖑',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error("Error in .alive:", err);
        return reply(`❌ *Alive Command Error:*\n${err.message}`);
    }
});
