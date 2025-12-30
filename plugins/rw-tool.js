const axios = require('axios');
const { malvin } = require('../malvin');

malvin({
    pattern: 'rw',
    alias: ['randomwall', 'wallpaper'],
    react: '🌌',
    desc: 'fetch random wallpaper 📸',
    category: 'fun',
    use: '.rw <keyword>',
    filename: __filename
}, async (malvin, mek, m, { from, args, reply }) => {
    try {
        const query = args.join(' ') || 'random';
        await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });
        await reply(`🔍 fetching wallpaper for *${query}*...`);

        const apiUrl = `https://pikabotzapi.vercel.app/random/randomwall/?apikey=anya-md&query=${encodeURIComponent(query)}`;
        const { data } = await axios.get(apiUrl, { timeout: 15000 });

        if (!data?.status || !data?.imgUrl) {
            await reply(`❌ no wallpaper found for *${query}* 😔`);
            await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
            return;
        }

        const caption = `
╭━━〔*ᴡᴀʟʟᴘᴀᴘᴇʀ* 〕━━┈⊷
├ *ᴋᴇʏᴡᴏʀᴅ*: ${query} 🌌
╰──────────────┈⊷
> ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ`;

        await malvin.sendMessage(from, {
            image: { url: data.imgUrl },
            caption,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: mek });

        await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('❌ wallpaper error:', error);
        const errorMsg = error.message.includes('timeout')
            ? '❌ request timed out ⏰'
            : '❌ failed to fetch wallpaper 😞';
        await reply(errorMsg);
        await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});