const config = require('../settings');
const moment = require('moment-timezone');
const { malvin, commands } = require('../malvin');
const { runtime } = require('../lib/functions');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

// Fonction pour styliser les majuscules comme ʜɪ
function toUpperStylized(str) {
  const stylized = {
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ',
    I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ',
    Q: 'ǫ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x',
    Y: 'ʏ', Z: 'ᴢ'
  };
  return str.split('').map(c => stylized[c.toUpperCase()] || c).join('');
}

// Normalisation des catégories
const normalize = (str) => str.toLowerCase().replace(/\s+menu$/, '').trim();

// Emojis par catégorie
const emojiByCategory = {
  ai: '🤖',
  anime: '🍥',
  audio: '🎧',
  bible: '📖',
  download: '⬇️',
  downloader: '📥',
  fun: '🎮',
  game: '🕹️',
  group: '👥',
  img_edit: '🖌️',
  info: 'ℹ️',
  information: '🧠',
  logo: '🖼️',
  main: '🏠',
  media: '🎞️',
  menu: '📜',
  misc: '📦',
  music: '🎵',
  other: '📁',
  owner: '👑',
  privacy: '🔒',
  search: '🔎',
  settings: '⚙️',
  sticker: '🌟',
  tools: '🛠️',
  user: '👤',
  utilities: '🧰',
  utility: '🧮',
  wallpapers: '🖼️',
  whatsapp: '📱',
};

malvin({
  pattern: 'menu',
  alias: ['allmenu', 'help'],
  desc: 'Show all bot commands',
  category: 'menu',
  react: '👑',
  filename: __filename
}, async (malvin, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const timezone = config.TIMEZONE || 'Africa/Nairobi';
    const time = moment().tz(timezone).format('HH:mm:ss');
    const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

    const uptime = () => {
      let sec = process.uptime();
      let h = Math.floor(sec / 3600);
      let m = Math.floor((sec % 3600) / 60);
      let s = Math.floor(sec % 60);
      return `${h}h ${m}m ${s}s`;
    };

    let menu = `
╔═══════════════════════════╗
║         🔥 X GURU MENU 🔥         ║
╠═══════════════════════════╣
║ User         : @${sender.split("@")[0]}
║ Runtime      : ${uptime()}
║ Mode         : ${config.MODE.toUpperCase()}
║ Prefix       : [ ${prefix} ]
║ Plugins      : ${commands.length}
║ Owner        : GuruTech
║ Version      : 2.0.0
╚═══════════════════════════╝`;

    // Group commands by category
    const categories = {};
    for (const cmd of commands) {
      if (cmd.category && !cmd.dontAdd && cmd.pattern) {
        const normalizedCategory = normalize(cmd.category);
        categories[normalizedCategory] = categories[normalizedCategory] || [];
        categories[normalizedCategory].push(cmd.pattern.split('|')[0]);
      }
    }

    // Add categories with new table design
    for (const cat of Object.keys(categories).sort()) {
      const emoji = emojiByCategory[cat] || '✨';
      const catName = toUpperStylized(cat) + ' MENU';
      menu += `\n\n╔═════ ≪ ${emoji} ${catName} ≫ ═════╗`;
      for (const cmd of categories[cat].sort()) {
        menu += `\n║ • \( {prefix} \){cmd}`;
      }
      menu += `\n╚═══════════════════════════╝`;
    }

    menu += `\n\n> ${toUpperStylized('Powered by X GURU - Made with ❤️ by GuruTech')}`;

    // Context info
    const imageContextInfo = {
      mentionedJid: [sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: config.NEWSLETTER_JID || '120363421164015033@newsletter',
        newsletterName: 'GuruTech',
        serverMessageId: 143
      }
    };

    // Send menu with image
    await malvin.sendMessage(
      from,
      {
        image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/atpgij.jpg' },
        caption: menu,
        contextInfo: imageContextInfo
      },
      { quoted: mek }
    );

    // Send audio if configured
    if (config.MENU_AUDIO_URL) {
      await sleep(1000);
      await malvin.sendMessage(
        from,
        {
          audio: { url: config.MENU_AUDIO_URL },
          mimetype: 'audio/mp4',
          ptt: true,
          contextInfo: imageContextInfo
        },
        { quoted: mek }
      );
    }

  } catch (e) {
    console.error('Menu Error:', e);
    await reply(`❌ Error loading menu. Please try again.`);
  }
});
