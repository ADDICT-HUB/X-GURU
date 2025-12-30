const { malvin } = require('../malvin');
const config = require('../settings');
const moment = require('moment-timezone');

// Global Map to track reported messages
const reportedMessages = new Map();

malvin({
    pattern: 'report',
    alias: ['ask', 'bug', 'request'],
    desc: 'Report a bug or request a feature to the bot owner',
    category: 'main',
    filename: __filename,
    usage: `${config.PREFIX}report <message>`
}, async (malvin, mek, m, { from, args, reply, isOwner }) => {
    try {
        if (!isOwner) {
            return reply("❌ ᴏɴʟʏ ᴛʜᴇ ʙᴏᴛ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ");
        }

        if (!args.length) {
            return reply(
                `╭━━〔 *ʀᴇᴘᴏʀᴛ* 〕━━┈⊷\n` +
                `│\n` +
                `│ 📜 *ᴜsᴀɢᴇ:*\n` +
                `│ ➸ ${config.PREFIX}report <message>\n` +
                `│\n` +
                `│ 💡 *ᴇxᴀᴍᴘʟᴇ:*\n` +
                `│ ➸ ${config.PREFIX}report Play command is not working\n` +
                `╰──────────────┈⊷`
            );
        }

        const messageId = m.key.id;
        if (reportedMessages.has(messageId)) {
            return reply("ℹ️ ᴛʜɪs ʀᴇᴘᴏʀᴛ ʜᴀs ᴀʟʀᴇᴀᴅʏ ʙᴇᴇɴ ғᴏʀᴡᴀʀᴅᴇᴅ. ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ ғᴏʀ ᴀ ʀᴇsᴘᴏɴsᴇ.");
        }

        // Validate input length (WhatsApp max message length ~4096 characters)
        const reportMessage = args.join(' ');
        if (reportMessage.length > 1000) {
            return reply("❌ ʀᴇᴘᴏʀᴛ ᴍᴇssᴀɢᴇ ɪs ᴛᴏᴏ ʟᴏɴɢ (ᴍᴀx 1000 ᴄʜᴀʀᴀᴄᴛᴇʀs).");
        }

        // Format report with timestamp
        const timestamp = moment().tz(config.TIMEZONE || 'Africa/Harare').format('DD/MM/YYYY HH:mm:ss');
        const reportText = `
╭━━〔*ʀᴇᴘᴏʀᴛ/ʀᴇǫᴜᴇsᴛ* 〕━━┈⊷
│ 👤 *ᴜsᴇʀ*: @${m.sender.split('@')[0]}
│ ⏰ *ᴛɪᴍᴇ*: ${timestamp}
│ 📝 *ᴍᴇssᴀɢᴇ*: ${reportMessage}
╰──────────────┈⊷`;

        const confirmationText = `✅ ʜɪ ${m.pushName}, ʏᴏᴜʀ ʀᴇᴘᴏʀᴛ ʜᴀs ʙᴇᴇɴ ғᴏʀᴡᴀʀᴅᴇᴅ ᴛᴏ ᴛʜᴇ ᴏᴡɴᴇʀ. ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ...`;

        // Reusable context info
        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWSLETTER_JID || '120363299029326322@newsletter',
                newsletterName: config.OWNER_NAME || '𝖒𝖆𝖗𝖎𝖘𝖊𝖑',
                serverMessageId: 143
            }
        };

        // Send report to owner
        await malvin.sendMessage(`${config.DEV_NUMBER || '254740007567'}@s.whatsapp.net`, {
            text: reportText,
            contextInfo
        }, { quoted: m });

        // Mark as reported
        reportedMessages.set(messageId, true);
        // Clean up old reports (e.g., after 1 hour)
        setTimeout(() => reportedMessages.delete(messageId), 3600 * 1000);

        // Send confirmation
        await reply(confirmationText);

    } catch (error) {
        console.error('❌ Report command error:', error.message);
        let errorMsg = '❌ ғᴀɪʟᴇᴅ ᴛᴏ ᴘʀᴏᴄᴇss ʏᴏᴜʀ ʀᴇᴘᴏʀᴛ.';
        if (error.message.includes('Invalid JID')) {
            errorMsg += ' ɪɴᴠᴀʟɪᴅ ᴏᴡɴᴇʀ ɴᴜᴍʙᴇʀ.';
        } else {
            errorMsg += ' ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.';
        }
        await reply(errorMsg);
    }
});