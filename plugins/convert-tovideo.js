const { malvin } = require('../malvin');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { spawn } = require('child_process');

// Configuration
const COVER_URL = 'https://files.catbox.moe/01f9y1.jpg';
const TEMP_DIR = path.join(__dirname, '../temp');
const MAX_RETRIES = 3;

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Utility functions
function getRandomFileName(ext) {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
}

async function downloadWithRetry(url, path, retries = MAX_RETRIES) {
    while (retries > 0) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            await fs.promises.writeFile(path, response.data);
            return true;
        } catch (err) {
            retries--;
            if (retries === 0) throw err;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

async function runFFmpeg(args, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath, args);
        let stderrData = '';

        const timer = setTimeout(() => {
            ffmpeg.kill();
            reject(new Error('FFmpeg timeout'));
        }, timeout);

        ffmpeg.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        ffmpeg.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0) {
                resolve(stderrData);
            } else {
                reject(new Error(`FFmpeg error ${code}\n${stderrData}`));
            }
        });

        ffmpeg.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

malvin({
    pattern: 'tovideo',
    desc: 'Convert audio to video with cover image',
    category: 'media',
    react: '🎬',
    filename: __filename
}, async (client, match, message, { from }) => {
    // Input validation
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

    // File paths
    const coverPath = path.join(TEMP_DIR, getRandomFileName('jpg'));
    const audioPath = path.join(TEMP_DIR, getRandomFileName('mp3'));
    const outputPath = path.join(TEMP_DIR, getRandomFileName('mp4'));

    try {
        // Send initial processing message
        const processingMsg = await client.sendMessage(from, {
            text: "*🔄 Starting conversion process...*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });

        // Step 1: Download cover image
        await client.sendMessage(from, {
            text: "*⬇️ Downloading cover image...*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*",
            edit: processingMsg.key
        });
        await downloadWithRetry(COVER_URL, coverPath);

        // Step 2: Save audio file
        await client.sendMessage(from, {
            text: "*💾 Saving audio file...*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*",
            edit: processingMsg.key
        });
        const audioBuffer = await match.quoted.download();
        await fs.promises.writeFile(audioPath, audioBuffer);

        // Step 3: Convert to video
        await client.sendMessage(from, {
            text: "*🎥 Converting to video...*\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*",
            edit: processingMsg.key
        });

        const ffmpegArgs = [
            '-y',
            '-loop', '1',
            '-i', coverPath,
            '-i', audioPath,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',  // Changed to ultrafast for better compatibility
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-vf', 'scale=640:640:force_original_aspect_ratio=increase',  // Square format
            '-movflags', '+faststart',
            outputPath
        ];

        await runFFmpeg(ffmpegArgs);

        // Verify output
        if (!fs.existsSync(outputPath)) {
            throw new Error('Output file was not created');
        }

        // Send result
        const videoBuffer = await fs.promises.readFile(outputPath);
        await client.sendMessage(from, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            caption: "🎵 Your Audio Visualized\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*"
        }, { quoted: message });

    } catch (error) {
        console.error('Conversion error:', error);
        await client.sendMessage(from, {
            text: `*❌ Conversion failed*\nError: ${error.message}\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`
        }, { quoted: message });
    } finally {
        // Cleanup files
        const filesToDelete = [coverPath, audioPath, outputPath];
        await Promise.all(
            filesToDelete.map(file => 
                fs.promises.unlink(file).catch(() => {})
            )
        );
    }
});
