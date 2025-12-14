const axios = require('axios');
const config = require('../settings');
const { malvin } = require('../malvin');
const moment = require('moment-timezone');

malvin({
    pattern: 'version',
    react: '🚀',
    desc: 'Check bot version & updates 📦',
    category: 'info',
    use: '.version',
    filename: __filename
}, async (malvin, mek, m, { from, sender, reply }) => {
    try {
        await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const time = moment().tz('Africa/Harare').format('HH:mm:ss');
        const date = moment().tz('Africa/Harare').format('DD/MM/YYYY');
        const localPackage = require('../package.json');
        const currentVersion = localPackage.version;

        let latestVersion = 'Unknown';
        let status = '🔍 *Remote check disabled*';

        if (config.CHECK_VERSION !== false) {
            const repoUrl = config.REPO || 'https://github.com/ADDICT-HUB/X-GURU';
            const repoPath = repoUrl.replace('https://github.com/', '');
            const rawUrl = `https://raw.githubusercontent.com/${repoPath}/master/package.json`;

            try {
                const { data: remotePackage } = await axios.get(rawUrl, { timeout: 15000 });
                latestVersion = remotePackage.version || 'Unknown';
                status = currentVersion === latestVersion
                    ? '✅ *Up-to-date*'
                    : '⚠️ *Update available*';
            } catch (err) {
                console.warn('⚠️ Failed to fetch remote version:', err.message);
            }
        }

        const caption = `
╭───[ *X-GURU Bot Version* ]───
├ *Current*: v${currentVersion} 📍
├ *Latest*: v${latestVersion} 🆕
├ *Status*: ${status}
├ *Checked*: ${date} 🗓️
├ *Time*: ${time} 🕒
├ *Bot*: ${config.BOT_NAME || 'X-GURU'} 🤖
├ *Developer*: ${config.DEV_NAME || 'GuruTech'}
├ *Repo*: ${config.REPO || 'https://github.com/ADDICT-HUB/X-GURU'} 📦
╰──────────────┈⊷
> *Made by GuruTech*`;

        await malvin.sendMessage(from, {
            image: { url: config.ALIVE_IMG || 'https://files.catbox.moe/75baia.jpg' },
            caption,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421164015033@newsletter',
                    newsletterName: config.BOT_NAME ? `${config.BOT_NAME} Bot` : 'X-GURU',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

        await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('❌ Version check error:', error);

        const localVersion = require('../package.json').version;
        const caption = `
╭───[ *Version Error* ]───
├ *Local Version*: v${localVersion} 📍
├ *Error*: ${error.message || 'unknown error'} ❌
├ *Repo*: ${config.REPO || 'not configured'} 📦
╰──────────────┈⊷
> *Made by GuruTech*`;

        await reply(caption);
        await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
