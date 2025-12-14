const config = require('../settings');
const { malvin } = require('../malvin');
const moment = require('moment-timezone');

const botStartTime = process.hrtime.bigint();
const formatCache = new Map();

const emojiSets = {
    reactions: ['⚡', '🚀', '💨', '🎯', '🌟', '💎', '🔥', '✨', '🌀', '🔹'],
    bars: [
        '▰▰▰▰▰▰▰▰▰▰',
        '▰▱▱▱▱▱▱▱▱▱',
        '▰▰▱▱▱▱▱▱▱▱',
        '▰▰▰▱▱▱▱▱▱▱',
        '▰▰▰▰▱▱▱▱▱▱'
    ],
    status: [
        { threshold: 0.3, text: '🚀 Super Fast' },
        { threshold: 0.6, text: '⚡ Fast' },
        { threshold: 1.0, text: '⚠️ Medium' },
        { threshold: Infinity, text: '🐢 Slow' }
    ]
};

malvin({
    pattern: 'ping',
    alias: ['speed', 'pong', 'p'],
    desc: 'Check bot\'s response time and status',
    category: 'main',
    react: '⚡',
    filename: __filename
}, async (malvin, mek, m, { from, sender, reply }) => {
    try {
        const start = process.hrtime.bigint();
        const reactionEmoji = emojiSets.reactions[Math.floor(Math.random() * emojiSets.reactions.length)];
        const loadingBar = emojiSets.bars[Math.floor(Math.random() * emojiSets.bars.length)];
        const maxAttempts = 2;

        // React
        for (let i = 0; i < maxAttempts; i++) {
            try { await malvin.sendMessage(from, { react: { text: reactionEmoji, key: mek.key } }); break; } 
            catch { if (i === maxAttempts - 1) throw new Error('Failed to send reaction'); }
        }

        const responseTime = Number(process.hrtime.bigint() - start) / 1e9;
        const statusText = emojiSets.status.find(s => responseTime < s.threshold)?.text || '🐢 Slow';

        const timezone = config.TIMEZONE || 'Africa/Harare';
        const cacheKey = `${timezone}:${moment().format('YYYY-MM-DD HH:mm:ss')}`;
        let time, date;

        if (formatCache.has(cacheKey)) {
            ({ time, date } = formatCache.get(cacheKey));
        } else {
            time = moment().tz(timezone).format('HH:mm:ss');
            date = moment().tz(timezone).format('DD/MM/YYYY');
            formatCache.set(cacheKey, { time, date });
            if (formatCache.size > 100) formatCache.clear();
        }

        const uptimeSeconds = Number(process.hrtime.bigint() - botStartTime) / 1e9;
        const uptime = moment.duration(uptimeSeconds, 'seconds').humanize();

        const memory = process.memoryUsage();
        const memoryUsage = `${(memory.heapUsed / 1024 / 1024).toFixed(2)}/${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`;

        const nodeVersion = process.version;
        const ownerName = config.OWNER_NAME || 'Marisel';
        const botName = config.BOT_NAME || '𝖒𝖆𝖗𝖎𝖘𝖊𝖑';
        const repoLink = config.REPO || 'https://github.com/betingrich4/Mercedes';

        const pingMsg = `
*${statusText}*

⚡ \`Response Time:\` ${responseTime.toFixed(2)}s
⏰ \`Time:\` ${time} (${timezone})
📅 \`Date:\` ${date}
⏱️ \`Uptime:\` ${uptime}
💾 \`Memory Usage:\` ${memoryUsage}
🖥️ \`Node Version:\` ${nodeVersion}

💻 \`Developer:\` ${ownerName}
🤖 \`Bot Name:\` ${botName}

🌟 Don't forget to *star* & *fork* the repo!
🔗 ${repoLink}

${loadingBar}
`.trim();

        // Send ping info
        for (let i = 0; i < maxAttempts; i++) {
            try {
                await malvin.sendMessage(from, {
                    text: pingMsg,
                    contextInfo: {
                        mentionedJid: [sender],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363299029326322@newsletter',
                            newsletterName: botName,
                            serverMessageId: 143
                        }
                    }
                }, { quoted: mek });
                break;
            } catch { if (i === maxAttempts - 1) throw new Error('Failed to send message'); }
        }

        await malvin.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error('❌ Ping command error:', e);
        await reply(`❌ Error: ${e.message || 'Failed to process ping command'}`);
        await malvin.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
});
