

const converter = require('../data/mediaconverter');
const { malvin } = require('../malvin');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');

// ==================== UTILITY FUNCTIONS ====================
function getRandomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
}

function getExtensionFromMime(mimeType) {
    const extensions = {
        'audio/mpeg': 'mp3',
        'audio/aac': 'aac',
        'audio/ogg': 'ogg',
        'audio/opus': 'opus',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'image/jpeg': 'jpg'
    };
    return extensions[mimeType] || 'bin';
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m > 9 ? m : h ? '0' + m : m || '0', s > 9 ? s : '0' + s]
        .filter(Boolean)
        .join(':');
}

// ==================== COVER IMAGE HANDLING ====================
const COVER_URL = 'https://files.catbox.moe/18il7k.jpg';
let coverImagePath = null;

async function ensureCoverImage() {
    if (!coverImagePath) {
        coverImagePath = path.join(converter.tempDir, `cover_${getRandomString()}.jpg`);
        try {
            const response = await axios.get(COVER_URL, { responseType: 'arraybuffer' });
            await fs.promises.writeFile(coverImagePath, response.data);
        } catch (e) {
            console.error('Failed to download cover image:', e);
            throw new Error('Could not download cover image');
        }
    }
    return coverImagePath;
}

// ==================== TOVIDEO COMMAND ====================
malvin({
    pattern: 'tovideo2',
    desc: 'Convert audio to video with cover image',
    category: 'media',
    react: '🎬',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🎵 Please reply to an audio message*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });
    }

    if (match.quoted.mtype !== 'audioMessage') {
        return await client.sendMessage(from, {
            text: "*❌ Only audio messages can be converted to video*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });
    }

    const processingMsg = await client.sendMessage(from, {
        text: "*🔄 Downloading cover image and preparing video...*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
    }, { quoted: message });

    try {
        const imagePath = await ensureCoverImage();
        const buffer = await match.quoted.download();
        const audioPath = path.join(converter.tempDir, `audio_${getRandomString()}.mp3`);
        const outputPath = path.join(converter.tempDir, `video_${getRandomString()}.mp4`);

        await fs.promises.writeFile(audioPath, buffer);

        await client.sendMessage(from, {
            text: "*🔄 Converting audio to video (this may take a while)...*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*",
            edit: processingMsg.key
        });

        const ffmpegArgs = [
            '-loop', '1',
            '-i', imagePath,
            '-i', audioPath,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '22',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-vf', 'scale=640:480:force_original_aspect_ratio=decrease',
            outputPath
        ];

        await new Promise((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, ffmpegArgs);
            ffmpeg.on('close', async (code) => {
                await Promise.all([
                    converter.cleanFile(audioPath),
                    converter.cleanFile(imagePath)
                ]);
                code !== 0 ? reject(new Error(`FFmpeg error ${code}`)) : resolve();
            });
            ffmpeg.on('error', reject);
        });

        const videoBuffer = await fs.promises.readFile(outputPath);
        await converter.cleanFile(outputPath);

        await client.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: "🎵 Audio Visualized\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });

    } catch (e) {
        console.error('Video conversion error:', e);
        await client.sendMessage(from, {
            text: `*❌ Failed to convert to video*\n${e.message}\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`
        }, { quoted: message });
    }
});

// ==================== TOMP3 COMMAND ====================
malvin({
    pattern: 'tomp3',
    desc: 'Convert media to audio',
    category: 'audio',
    react: '🎵',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🔊 Please reply to a video/audio message*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });
    }

    if (!['videoMessage', 'audioMessage'].includes(match.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*❌ Only video/audio messages can be converted*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });
    }

    if (match.quoted.seconds > 300) {
        return await client.sendMessage(from, {
            text: `*⏱️ Media too long (max 5 minutes)*\nDuration: ${formatDuration(match.quoted.seconds)}\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`
        }, { quoted: message });
    }

    await client.sendMessage(from, {
        text: "*🔄 Converting to audio...*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
    }, { quoted: message });

    try {
        const buffer = await match.quoted.download();
        const ext = getExtensionFromMime(match.quoted.mimetype) || 
                   (match.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a');
        const audio = await converter.toAudio(buffer, ext);

        await client.sendMessage(from, {
            audio: audio,
            mimetype: 'audio/mpeg'
        }, { quoted: message });

    } catch (e) {
        console.error('Conversion error:', e);
        await client.sendMessage(from, {
            text: "*❌ Failed to process audio*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });
    }
});

// ==================== TOPTT COMMAND ====================
malvin({
    pattern: 'toptt',
    alias: ['toaudio'],
    desc: 'Convert media to voice message',
    category: 'audio',
    react: '🎙️',
    filename: __filename
}, async (client, match, message, { from }) => {
    if (!match.quoted) {
        return await client.sendMessage(from, {
            text: "*🗣️ Please reply to a video/audio message*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });
    }

    if (!['videoMessage', 'audioMessage'].includes(match.quoted.mtype)) {
        return await client.sendMessage(from, {
            text: "*❌ Only video/audio messages can be converted*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });
    }

    if (match.quoted.seconds > 60) {
        return await client.sendMessage(from, {
            text: `*⏱️ Media too long for voice (max 1 minute)*\nDuration: ${formatDuration(match.quoted.seconds)}\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`
        }, { quoted: message });
    }

    await client.sendMessage(from, {
        text: "*🔄 Converting to voice message...*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
    }, { quoted: message });

    try {
        const buffer = await match.quoted.download();
        const ext = getExtensionFromMime(match.quoted.mimetype) || 
                   (match.quoted.mtype === 'videoMessage' ? 'mp4' : 'm4a');
        const ptt = await converter.toPTT(buffer, ext);

        await client.sendMessage(from, {
            audio: ptt,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: message });

    } catch (e) {
        console.error('PTT conversion error:', e);
        await client.sendMessage(from, {
            text: "*❌ Failed to create voice message*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });
    }
});
