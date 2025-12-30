const { malvin } = require('../malvin');

const tinyCaps = (text) => {
  const map = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ',
    h: 'ʜ', i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ',
    o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ',
    v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
  };
  return text.split('').map(c => map[c.toLowerCase()] || c).join('');
};

malvin({
  pattern: "dev",
  alias: ["developer", "dev"],
  desc: "Displays the developer info",
  category: "owner",
  react: "👨‍💻",
  filename: __filename
}, async (malvin, mek, m, { from, reply, pushname }) => {
  try {
    const name = pushname || "there";

    const caption = `
╭─⌈ ${tinyCaps("ᴍᴇʀᴄᴇᴅᴇs")}* ⌋─
│ 👋 Hello, *${name}*!
│ 🤖 I'm Mariael, the creator & maintainer
│    of this smart WhatsApp bot.
│ 👨‍💻 *OWNER INFO:*
│ ───────────────
│ 🧠 Name    : 𝖒𝖆𝖗𝖎𝖘𝖊𝖑
│ 🎂 Age     : 20+
│ 📞 Contact : wa.me/254740007567
│ 📺 YouTube : 𝖒𝖆𝖗𝖎𝖘𝖊𝖑
│            https://youtube.com/@wemacomic
│
╰───────────────

> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*
`.trim();

    await malvin.sendMessage(
      from,
      {
        image: { url: 'https://url.bwmxmd.online/Adams.xm472dqv.jpeg' },
        caption,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '1120363299029326322@newsletter',
            newsletterName: '𝖒𝖆𝖗𝖎𝖘𝖊𝖑',
            serverMessageId: 143
          },
          externalAdReply: {
            title: "ᴍᴇʀᴄᴇᴅᴇs",
            body: "𝖒𝖆𝖗𝖎𝖘𝖊𝖑",
            thumbnailUrl: 'https://url.bwmxmd.online/Adams.0dhfcjpi.jpeg',
            mediaType: 1,
            renderSmallerThumbnail: true,
            showAdAttribution: true,
            mediaUrl: "https://youtube.com/@wemacomic",
            sourceUrl: "https://youtube.com/@wemacomic"
          }
        }
      },
      { quoted: mek }
    );
  } catch (e) {
    console.error("Error in .owner command:", e);
    return reply(`❌ Error: ${e.message || e}`);
  }
});
