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
  alias: ["developer", "owner"],
  desc: "Displays the developer info",
  category: "owner",
  react: "👨‍💻",
  filename: __filename
}, async (malvin, mek, m, { from, reply, pushname }) => {
  try {
    const name = pushname || "there";

    const caption = `
╭─⌈ ${tinyCaps("X-GURU")} ⌋─
│ 👋 Hello, *${name}*!
│ 🤖 I'm GuruTech, the creator & maintainer
│    of this smart WhatsApp bot.
│ 👨‍💻 *OWNER INFO:*
│ ───────────────
│ 🧠 Name    : GuruTech
│ 🎂 Age     : 20+
│ 📞 Contact : wa.me/+254735403829
│ 📺 YouTube : GuruTech
│            https://youtube.com/@wemacomic
│
╰───────────────

> *Made by GuruTech | Powered by X-GURU*
`.trim();

    await malvin.sendMessage(
      from,
      {
        image: { url: 'https://files.catbox.moe/75baia.jpg' },
        caption,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363421164015033@newsletter',
            newsletterName: 'X-GURU',
            serverMessageId: 143
          },
          externalAdReply: {
            title: "X-GURU",
            body: "GuruTech",
            thumbnailUrl: 'https://files.catbox.moe/75baia.jpg',
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
    console.error("Error in .dev command:", e);
    return reply(`❌ Error: ${e.message || e}`);
  }
});
