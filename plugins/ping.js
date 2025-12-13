const config = require('../settings');
const { malvin } = require('../malvin');
const moment = require('moment-timezone');

// Bot start time
const botStartTime = process.hrtime.bigint();

malvin({
    pattern: 'ping',
    alias: ['speed', 'pong','p'],
    desc: 'Check bot\'s response time and status',
    category: 'main',
    react: '⚡',
    filename: __filename
}, async (malvin, mek, m, { from, sender, reply }) => {
    try {
        const prefix = config.PREFIX || '.';
        const ownerName = config.OWNER_NAME || 'GuruTech';
        const botName = config.BOT_NAME || 'X-GURU';
        const repoLink = config.REPO || 'https://github.com/ADDICT-HUB/X-GURU';
        const timezone = config.TIMEZONE || 'Africa/Harare';

        // Capture start time for response
        const start = process.hrtime.bigint();

        // Current time & date
        const time = moment().tz(timezone).format('HH:mm:ss');
        const date = moment().tz(timezone).format('DD/MM/YYYY');

        // Uptime
        const uptimeSeconds = Number(process.hrtime.bigint() - botStartTime) / 1e9;
        const uptime = moment.duration(uptimeSeconds, 'seconds').humanize();

        // Memory usage
        const memory = process.memoryUsage();
        const memoryUsage = `${(memory.heapUsed / 1024 / 1024).toFixed(2)}/${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`;

        // Response time
        const responseTime = Number(process.hrtime.bigint() - start) / 1e9;

        // Status text based on response
        let statusText = '';
        if (responseTime < 0.3) statusText = 'Super Fast';
        else if (responseTime < 0.6) statusText = 'Fast';
        else if (responseTime < 1.0) statusText = 'Medium';
        else statusText = 'Slow';

        // Loading bar simulation (text only, single message)
        const loadingBar = '▰▰▰▱▱▱▱▱▱▱';

        // Compose ping message
        const pingMsg = `
┌───────────────
│ ${botName} Status
├───────────────
│ Status       : ${statusText}
│ Response Time: ${responseTime.toFixed(2)}s
│ Time         : ${time} (${timezone})
│ Date         : ${date}
│ Uptime       : ${uptime}
│ Memory Usage : ${memoryUsage}
│ Owner        : ${ownerName}
│ Bot Name     : ${botName}
│ Repo         : ${repoLink}
├───────────────
│ Loading      : ${loadingBar}
└───────────────
> Report any issues to the developer
`.trim();

        // Send single message only
        await malvin.sendMessage(from, {
            text: pingMsg,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421164015033@newsletter',
                    newsletterName: ownerName,
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error('❌ Ping command error:', e);
        await reply(`❌ Error: ${e.message || 'Failed to process ping command'}`);
    }
});
