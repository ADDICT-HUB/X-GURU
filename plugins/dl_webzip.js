const axios = require('axios');
const { malvin } = require('../malvin');
const config = require('../settings');

malvin({
    pattern: 'webzip',
    alias: ['sitezip', 'web', 'archive'],
    react: '📦',
    desc: 'archive website to zip 📂',
    category: 'tools',
    use: '.webzip <url>',
    filename: __filename
}, async (malvin, mek, m, { from, reply, args }) => {
    try {
        const url = args[0];
        if (!url) {
            return reply('❌ please provide a url\nexample: .webzip https://example.com');
        }

        if (!url.match(/^https?:\/\//)) {
            return reply('❌ invalid url, use http:// or https://');
        }

        await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const apiUrl = `https://api.giftedtech.web.id/api/tools/web2zip?apikey=gifted&url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });

        if (!response.data?.success || !response.data?.result?.download_url) {
            return reply('❌ failed to archive website\nsite may be restricted or too large');
        }

        const { siteUrl, copiedFilesAmount, download_url } = response.data.result;

        const caption = `
╭───[ *ᴡᴇʙᴢɪᴘ* ]───
├ *sɪᴛᴇ*: ${siteUrl} 🌐
├ *ғɪʟᴇs*: ${copiedFilesAmount} 📂
╰───[ *ᴍᴇʀᴄᴇᴅᴇs* ]───
> *powered by malvin* ♡`;

        await reply('⏳ archiving website...');

        const zipResponse = await axios.get(download_url, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        if (!zipResponse.data) {
            return reply('❌ failed to fetch archive\nfile may be too large');
        }

        const zipBuffer = Buffer.from(zipResponse.data, 'binary');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `archive_${timestamp}.zip`;

        await malvin.sendMessage(
            from,
            {
                document: zipBuffer,
                fileName: filename,
                mimetype: 'application/zip',
                caption: `${caption}\n✅ *archive downloaded*`,
                contextInfo: {
                    mentionedJid: [m.sender]
                }
            },
            { quoted: mek }
        );

        await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('❌ webzip error:', error);
        const errorMsg = error.message.includes('timeout')
            ? '❌ request timed out'
            : '❌ error archiving website';
        await reply(errorMsg);
        await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});