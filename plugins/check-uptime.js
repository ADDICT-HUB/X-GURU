const { malvin } = require('../malvin');
const { runtime } = require('../lib/functions');
const config = require('../settings');

// Define uptime display styles with a modern, elegant look
const uptimeStyles = [
  // Style 1: Elegant Dashboard
  ({ uptime, startTime }) => `
 *ᴜᴘᴛɪᴍᴇ ᴅᴀsʜʙᴏʀᴅ* 
─────────────
┠⏱️ *ᴜᴘᴛɪᴍᴇ*: ${uptime}
┠📅 *sᴛᴀʀᴛᴇᴅ*: ${startTime.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
┠✅ *sᴛᴀᴛᴜs*: ғᴜʟʟʏ ᴏᴘᴇʀᴀᴛɪᴏɴᴀʟ
> ${config.DESCRIPTION || 'ᴀᴍ ᴛʜᴇ ᴋɪɴɢ'}
──────────────
`,

  // Style 2: Sleek Card
  ({ uptime, startTime }) => `
┌──┥*ʙᴏᴛ ᴜᴘᴛɪᴍᴇ*┝──┐
│ 🕒 *ʀᴜɴɴɪɴɢ*: ${uptime}
│ 📆 *sɪɴᴄᴇ*: ${startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
│ ⚡ *sᴛᴀᴛᴜs*: ᴀᴄᴛɪᴠᴇ
└─⟤ ${config.DESCRIPTION || 'ᴍᴇʀᴄᴇᴅᴇs'}
`,
];

malvin({
  pattern: 'uptime',
  alias: ['runtime', 'up'],
  desc: 'Displays bot uptime in a modern, elegant format',
  category: 'main',
  react: '⏱️',
  filename: __filename,
}, async (malvin, mek, m, { from, reply }) => {
  try {
    // Calculate uptime and start time
    const uptime = runtime(process.uptime());
    const startTime = new Date(Date.now() - process.uptime() * 1000);

    // Select a random style
    const selectedStyle = uptimeStyles[Math.floor(Math.random() * uptimeStyles.length)]({ uptime, startTime });

    // Send the formatted message
    await malvin.sendMessage(from, {
      text: selectedStyle,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
        newsletterJid: config.NEWSLETTER_JID || '120363299029326322@newsletter',
          newsletterName: config.OWNER_NAME || 'ᴍᴇʀᴄᴇᴅᴇs',
          serverMessageId: 143,
        },
      },
    }, { quoted: mek });

  } catch (error) {
    console.error('Uptime Error:', error);
    await reply(`❌ Oops! Something went wrong: ${error.message}`);
  }
});