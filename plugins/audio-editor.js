

const { malvin } = require('../malvin');
const audioEditor = require('../data/audioeditor');

malvin({
    pattern: 'deep',
    desc: 'Make audio sound deeper',
    category: 'audio',
    react: '🗣️',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.deep(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'smooth',
    desc: 'Smooth out audio',
    category: 'audio',
    react: '🌀',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.smooth(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'deep',
    desc: 'Make audio sound deeper',
    category: 'audio',
    react: '🗣️',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.deep(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'fat',
    desc: 'Make audio sound fat/bassy',
    category: 'audio',
    react: '🍔',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.fat(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'tupai',
    desc: 'Special tupai effect',
    category: 'audio',
    react: '🐿️',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.tupai(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'blown',
    desc: 'Make audio sound blown out',
    category: 'audio',
    react: '💥',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.blown(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});


malvin({
    pattern: 'radio',
    desc: 'Make audio sound like old radio',
    category: 'audio',
    react: '📻',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.radio(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'robot',
    desc: 'Make audio sound robotic',
    category: 'audio',
    react: '🤖',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.robot(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'chipmunk',
    desc: 'Make audio sound high-pitched',
    category: 'audio',
    react: '🐿️',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.chipmunk(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});


malvin({
    pattern: 'nightcore',
    desc: 'Apply nightcore effect',
    category: 'audio',
    react: '🎶',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.nightcore(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'earrape',
    desc: 'Max volume (use with caution)',
    category: 'audio',
    react: '📢',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.earrape(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});


malvin({
    pattern: 'bass',
    desc: 'Add heavy bass boost to audio',
    category: 'audio',
    react: '🔊',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.bass(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'reverse',
    desc: 'Reverse audio',
    category: 'audio',
    react: '⏪',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.reverse(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'slow',
    desc: 'Slow down audio',
    category: 'audio',
    react: '🐌',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.slow(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'fast',
    desc: 'Speed up audio',
    category: 'audio',
    react: '⚡',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.fast(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'baby',
    desc: 'Make audio sound like a baby',
    category: 'audio',
    react: '👶',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.baby(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});

malvin({
    pattern: 'demon',
    desc: 'Make audio sound demonic',
    category: 'audio',
    react: '👹',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!message.quoted || !['audioMessage', 'videoMessage'].includes(message.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*🔊 Reply to an audio/video message*"
        }, { quoted: message });
    }

    await client.sendMessage(from, { react: { text: '⏳', key: message.key } });
    
    try {
        const buffer = await message.quoted.download();
        const ext = message.quoted.mtype === 'videoMessage' ? 'mp4' : 'mp3';
        const audio = await audioEditor.demon(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '✅', key: message.key } });
    } catch (e) {
        console.error('Error:', e);
        await client.sendMessage(from, {
            text: "❌ Failed to process audio"
        }, { quoted: message });
        await client.sendMessage(from, { react: { text: '❌', key: message.key } });
    }
});
