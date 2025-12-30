const config = require('../settings');
const { malvin } = require('../malvin');
const { ytsearch, ytmp3, ytmp4 } = require('@dark-yasiya/yt-dl.js'); 
const converter = require('../data/play-converter');
const fetch = require('node-fetch');
const ytSearch = require('yt-search');
const fs = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const osCallbacks = require('os');

const streamPipeline = promisify(pipeline);
const tmpDir = osCallbacks.tmpdir();

function toFancyFont(text) {
  const fonts = {
    a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ғ", g: "ɢ", h: "ʜ",
    i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ",
    q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x",
    y: "ʏ", z: "ᴢ"
  };
  return text.toLowerCase().split("").map(char => fonts[char] || char).join("");
}

malvin({ 
    pattern: "playx", 
    alias: ["yta"], 
    react: "☘️", 
    desc: "Download YouTube song via JawadTech API", 
    category: "main", 
    use: '.play2 <query or youtube url>', 
    filename: __filename 
}, async (malvin, mek, m, { from, args, q, reply, react: doReact }) => { 
    try {
        if (!q) return reply("*ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ sᴏɴɢ ɴᴀᴍᴇ ᴏʀ ʏᴏᴜᴛᴜʙᴇ ʟɪɴᴋ.*");

        let ytUrl = '';
        if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(q)) {
            ytUrl = q.trim();
        } else {
            const yt = await ytsearch(q);
            if (!yt.results.length) return reply("ɴᴏ ʀᴇsᴜʟᴛs ғᴏᴜɴᴅ!");
            ytUrl = yt.results[0].url;
        }

        // Using David Cyril's API first
        const apiUrl = `https://apis.davidcyriltech.my.id/play?query=${encodeURIComponent(q)}`;
        const apiResponse = await fetch(apiUrl);
        
        if (apiResponse.ok) {
            const data = await apiResponse.json();
            if (data.status && data.result.download_url) {
                const songInfo = `
${toFancyFont("*ᴍᴇʀᴄᴇᴅᴇs*")} sᴏɴɢ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ
${toFancyFont("*Title*")}: ${data.result.title}
${toFancyFont("*URL*")}: ${data.result.video_url}
`;

                await malvin.sendMessage(from, {
                    text: songInfo,
                    viewOnce: true
                }, { quoted: mek });

                const safeTitle = data.result.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').substring(0, 100);
                const filePath = `${tmpDir}/${safeTitle}.mp3`;
                
                const downloadResponse = await fetch(data.result.download_url);
                if (!downloadResponse.ok) throw new Error(`Download failed: ${downloadResponse.status}`);
                
                const fileStream = fs.createWriteStream(filePath);
                await streamPipeline(downloadResponse.body, fileStream);

                await malvin.sendMessage(from, {
                    audio: { url: filePath },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: `${safeTitle}.mp3`
                }, { quoted: mek });

                // Clean up
                setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 5000);
                await doReact("✅");
                return;
            }
        }

        // Fallback to JawadTech API
        const jawadApiUrl = `https://jawad-tech.vercel.app/download/ytmp3?url=${encodeURIComponent(ytUrl)}`;
        const res = await fetch(jawadApiUrl);
        const data = await res.json();

        if (!data?.result) {
            await doReact("❌");
            return reply("❌ ᴅᴏᴡɴʟᴏᴀᴅ ғᴀɪʟᴇᴅ. ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ.");
        }

        const audioRes = await fetch(data.result);
        const audioBuffer = await audioRes.buffer();

        let convertedAudio;
        try {
            convertedAudio = await converter.toAudio(audioBuffer, 'mp4');
        } catch (err) {
            console.error('Audio conversion failed:', err);
            await doReact("❌");
            return reply("❌ Audio conversion failed. Please try another song.");
        }

        await malvin.sendMessage(from, {
            audio: convertedAudio,
            mimetype: "audio/mpeg",
            fileName: `${data.metadata?.title || 'song'}.mp3`
        }, { quoted: mek });

        await doReact("✅");

    } catch (error) {
        console.error(error);
        await doReact("❌");
        reply("ᴀɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ. ᴘʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.");
    }
});

malvin({ 
    pattern: "ytac", 
    alias: ["play2", "audioy"], 
    react: "🎧", 
    desc: "Download YouTube song", 
    category: "main", 
    use: '.song <query>', 
    filename: __filename 
}, async (malvin, mek, m, { from, args, q, reply, react: doReact, sender }) => { 
    try {
        if (!q) return reply("*ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ sᴏɴɢ ɴᴀᴍᴇ..*");

        // Search YouTube
        await malvin.sendMessage(from, {
            text: `*Mercedes* ${toFancyFont("Searching’")} ${toFancyFont("for")} "${q}"`,
            viewOnce: true
        }, { quoted: mek });

        const searchResults = await ytSearch(q);
        if (!searchResults.videos || searchResults.videos.length === 0) {
            await doReact("❌");
            return reply(`${toFancyFont("no")} ${toFancyFont("tracks")} ${toFancyFont("found")}`);
        }

        const song = searchResults.videos[0];
        const apiUrl = `https://apis.davidcyriltech.my.id/play?query=${encodeURIComponent(q)}`;
        const apiResponse = await fetch(apiUrl);
        
        if (!apiResponse.ok) throw new Error(`API status: ${apiResponse.status}`);
        
        const data = await apiResponse.json();
        if (!data.status || !data.result.download_url) throw new Error('Invalid API response');

        const songInfo = `
${toFancyFont("*ᴍᴇʀᴄᴇᴅᴇs*")} sᴏɴɢ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ
${toFancyFont("*Title*")}: ${data.result.title || song.title}
${toFancyFont("*Views*")}: ${song.views.toLocaleString()}
${toFancyFont("*Duration*")}: ${song.timestamp}
${toFancyFont("*Channel*")}: ${song.author.name}
${toFancyFont("*URL*")}: ${data.result.video_url || song.url}
`;

        const buttons = [
            { buttonId: `${config.PREFIX}img ${q}`, buttonText: { displayText: `${toFancyFont("img")}` }, type: 1 },
            { buttonId: `${config.PREFIX}lyrics ${q}`, buttonText: { displayText: `${toFancyFont("Lyrics")}` }, type: 1 },
            { buttonId: `${config.PREFIX}yts ${q}`, buttonText: { displayText: `${toFancyFont("Yts")}` }, type: 1 },
            { buttonId: `${config.PREFIX}video ${q}`, buttonText: { displayText: `${toFancyFont("video")}` }, type: 1 },
            { buttonId: `${config.PREFIX}song ${q}`, buttonText: { displayText: `🎧${toFancyFont("get")} ${toFancyFont("song")}` }, type: 1 }
        ];

        await malvin.sendMessage(from, {
            text: songInfo,
            image: { url: song.thumbnail },
            viewOnce: true,
            buttons,
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });

        const safeTitle = song.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').substring(0, 100);
        const filePath = `${tmpDir}/${safeTitle}.mp3`;
        
        const downloadResponse = await fetch(data.result.download_url);
        if (!downloadResponse.ok) throw new Error(`Download failed: ${downloadResponse.status}`);
        
        const fileStream = fs.createWriteStream(filePath);
        await streamPipeline(downloadResponse.body, fileStream);

        await malvin.sendMessage(from, {
            audio: { url: filePath },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${safeTitle}.mp3`
        }, { quoted: mek });

        // Add lyrics button after successful download
        await malvin.sendMessage(from, {
            text: `*${song.title}* downloaded!\nWant lyrics for this track?`,
            buttons: [{
                buttonId: `getlyrics_${encodeURIComponent(song.title)}`,
                buttonText: { displayText: "Get Lyrics" },
                type: 1
            }],
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });

        // Clean up
        setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 5000);
        await doReact("✅");

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        await malvin.sendMessage(from, {
            text: `*Mercedes* ${toFancyFont("error")}! ${toFancyFont("try")} ${toFancyFont("again")}`,
            viewOnce: true,
            buttons: [{ buttonId: `${config.PREFIX}support`, buttonText: { displayText: `⚠︎${toFancyFont("support")}` }, type: 1 }],
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });
        await doReact("❌");
    }
});

malvin({
    pattern: "play3",
    alias: ["youtube", "song3"],
    react: "🎵",
    desc: "Download high quality YouTube audio",
    category: "media",
    use: "<song name>",
    filename: __filename
}, async (malvin, mek, m, { from, args, q, reply, react: doReact, sender }) => {
    try {
        if (!q) return reply("ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ a sᴏɴɢ ɴᴀᴍᴇ\nExample: .ᴘʟᴀʏ2 ᴄᴇɴᴛʀᴀʟ ᴄᴇᴇ sᴘʀɪɴᴛᴇʀ");

        // Step 1: Search YouTube
        await malvin.sendMessage(from, { 
            text: `*Mercedes* ${toFancyFont("Searching’")} ${toFancyFont("for")} "${q}"`,
            viewOnce: true
        }, { quoted: mek });

        const searchResults = await ytSearch(q);
        if (!searchResults.videos || searchResults.videos.length === 0) {
            await doReact("❌");
            return reply(`${toFancyFont("no")} ${toFancyFont("tracks")} ${toFancyFont("found")}`);
        }

        const song = searchResults.videos[0];
        const apiUrl = `https://apis.davidcyriltech.my.id/play?query=${encodeURIComponent(q)}`;
        const apiResponse = await fetch(apiUrl);
        
        if (!apiResponse.ok) throw new Error(`API status: ${apiResponse.status}`);
        
        const data = await apiResponse.json();
        if (!data.status || !data.result.download_url) throw new Error('Invalid API response');

        const caption =
`${toFancyFont("*ᴍᴇʀᴄᴇᴅᴇs*")} sᴏɴɢ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ
┏─────────────⊷
┇๏ *ᴛɪᴛʟᴇ*    –  ${data.result.title || song.title}
┇๏ *ᴅᴜʀᴀᴛɪᴏɴ* –  ${song.timestamp}
┇๏ *ᴠɪᴇᴡs*    –  ${song.views.toLocaleString()}
┇๏ *ᴀᴜᴛʜᴏʀ*   –  ${song.author.name}
┇๏ *ᴜʀʟ*     –  ${data.result.video_url || song.url}
┗──────────────⊷
> *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴀᴜᴅɪᴏ ғɪʟᴇ*`;

        // Step 2: Send video info with thumbnail
        await malvin.sendMessage(from, {
            image: { url: song.thumbnail },
            caption,
            viewOnce: true
        }, { quoted: mek });

        const safeTitle = song.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').substring(0, 100);
        const filePath = `${tmpDir}/${safeTitle}.mp3`;
        
        const downloadResponse = await fetch(data.result.download_url);
        if (!downloadResponse.ok) throw new Error(`Download failed: ${downloadResponse.status}`);
        
        const fileStream = fs.createWriteStream(filePath);
        await streamPipeline(downloadResponse.body, fileStream);

        // Step 3: Send audio file
        await malvin.sendMessage(from, {
            audio: { url: filePath },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${safeTitle}.mp3`
        }, { quoted: mek });

        // Add lyrics button
        await malvin.sendMessage(from, {
            text: `*${song.title}* downloaded!\nWant lyrics for this track?`,
            buttons: [{
                buttonId: `getlyrics_${encodeURIComponent(song.title)}`,
                buttonText: { displayText: "Get Lyrics" },
                type: 1
            }],
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });

        // Clean up
        setTimeout(() => fs.existsSync(filePath) && fs.unlinkSync(filePath), 5000);
        await doReact("✅");

    } catch (error) {
        console.error('Play2 command error:', error);
        await malvin.sendMessage(from, {
            text: `*Mercedes* ${toFancyFont("error")}! ${toFancyFont("try")} ${toFancyFont("again")}`,
            viewOnce: true,
            buttons: [{ buttonId: `${config.PREFIX}support`, buttonText: { displayText: `⚠︎${toFancyFont("support")}` }, type: 1 }],
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });
        await doReact("❌");
    }
});

// Lyrics button handler
const handleButtons = async (malvin, mek, m, { from, reply }) => {
    if (m.buttonId.startsWith('getlyrics_')) {
        try {
            const songTitle = decodeURIComponent(m.buttonId.replace('getlyrics_', ''));
            await malvin.sendMessage(from, {
                text: `🔍 Searching lyrics for *${songTitle}*...`
            }, { quoted: mek });

            const lyricsApi = `https://api.giftedtech.web.id/api/search/lyrics?apikey=gifted&query=${encodeURIComponent(songTitle)}`;
            const response = await fetch(lyricsApi);
            const data = await response.json();

            if (data.status && data.result) {
                await malvin.sendMessage(from, {
                    text: `🎶 *${songTitle}*\n\n${data.result.lyrics}\n\n_Lyrics provided by GiftedTech API_`
                }, { quoted: mek });
            } else {
                await malvin.sendMessage(from, {
                    text: `❌ No lyrics found for *${songTitle}*`
                }, { quoted: mek });
            }
        } catch (e) {
            await malvin.sendMessage(from, {
                text: `⚠️ Failed to fetch lyrics: ${e.message}`
            }, { quoted: mek });
        }
    }
};

// Add the button handler to your command exports
module.exports = {
    malvin,
    handleButtons
};
