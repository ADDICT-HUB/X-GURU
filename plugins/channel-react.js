const { malvin } = require('../malvin');

const stylizedChars = {
    a: '🅐', b: '🅑', c: '🅒', d: '🅓', e: '🅔', f: '🅕', g: '🅖',
    h: '🅗', i: '🅘', j: '🅙', k: '🅚', l: '🅛', m: '🅜', n: '🅝',
    o: '🅞', p: '🅟', q: '🅠', r: '🅡', s: '🅢', t: '🅣', u: '🅤',
    v: '🅥', w: '🅦', x: '🅧', y: '🅨', z: '🅩',
    '0': '⓿', '1': '➊', '2': '➋', '3': '➌', '4': '➍',
    '5': '➎', '6': '➏', '7': '➐', '8': '➑', '9': '➒'
};

malvin({
    pattern: 'channelreact',
    alias: ['creact', 'chr'],
    react: '🔤',
    desc: 'send stylized emoji reaction to channel 📢',
    category: 'owner',
    use: '.chr <channel-link> <text>',
    filename: __filename
}, async (malvin, mek, m, { q, command, isCreator, reply, from }) => {
    try {
        if (!isCreator) {
            return reply('❌ owner-only command 🚫');
        }

        if (!q) {
            return reply(`❌ usage: ${command} https://whatsapp.com/channel/<id>/<msg-id> <text>\nexample: .chr https://whatsapp.com/channel/1234/5678 hello`);
        }

        await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const [link, ...textParts] = q.trim().split(' ');
        const inputText = textParts.join(' ').toLowerCase();

        if (!link.includes('whatsapp.com/channel/') || !inputText) {
            return reply('❌ invalid channel link or missing text 😔');
        }

        const urlSegments = link.trim().split('/');
        const channelInvite = urlSegments[4];
        const messageId = urlSegments[5];

        if (!channelInvite || !messageId) {
            return reply('❌ invalid channel or message id 🚫');
        }

        // Stylize input text
        const emoji = inputText
            .split('')
            .map(char => (char === ' ' ? '―' : stylizedChars[char] || char))
            .join('');

        // Get newsletter metadata
        const { id: channelJid, name: channelName } = await malvin.newsletterMetadata('newsletter', channelInvite);

        // Send stylized reaction
        await malvin.newsletterReactMessage(channelJid, messageId, emoji);

        const caption = `
╭───[ *ᴄʜᴀɴɴᴇʟ ʀᴇᴀᴄᴛ* ]───
├ *ᴄʜᴀɴɴᴇʟ*: ${channelName} 
├ *ʀᴇᴀᴄᴛɪᴏɴ*: ${emoji} 🔤
╰───[ *ᴍᴇʀᴄᴇᴅᴇs* ]───
> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`;

        await malvin.sendMessage(from, {
            text: caption,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: mek });

        await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('❌ channelreact error:', error);
        const errorMsg = error.message.includes('not-authorized')
            ? '❌ bot not authorized for channel 😞'
            : error.message.includes('not-found')
            ? '❌ channel or message not found 😔'
            : '❌ error sending reaction ⏰';
        await reply(errorMsg);
        await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});