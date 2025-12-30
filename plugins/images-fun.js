const config = require('../settings')
const axios = require('axios');
const { malvin, commands } = require('../malvin')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')
const fs = require('fs');
var imgmsg = "*Give me a anime name !*"
var descgs = "It gives details of given anime name."
var cants = "I cant find this anime."

//====================================================================================
malvin({
    pattern: "garl",
    alias: ["imgloli"],
    react: '😎',
    desc: "Download anime loli images.",
    category: "anime",
    use: '.loli',
    filename: __filename
},
async(malvin, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{

let res = await axios.get('https://api.lolicon.app/setu/v2?num=1&r18=0&tag=lolicon')
let wm = `😎 Random Garl image

 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`
await malvin.sendMessage(from, { image: { url: res.data.data[0].urls.original }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})

//=====================================================================
malvin({
    pattern: "waifu",
    alias: ["imgwaifu"],
    react: '💫',
    desc: "Download anime waifu images.",
    category: "anime",
    use: '.waifu',
    filename: __filename
},
async(malvin, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let res = await axios.get('https://api.waifu.pics/sfw/waifu')
let wm = `🩵 Random Waifu image

 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`
await malvin.sendMessage(from, { image: { url: res.data.url }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})

//================================================================
malvin({
    pattern: "neko",
    alias: ["imgneko"],
    react: '💫',
    desc: "Download anime neko images.",
    category: "anime",
    use: '.neko',
    filename: __filename
},
async(malvin, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let res = await axios.get('https://api.waifu.pics/sfw/neko')
let wm = `🩷 Random neko image

 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`
await malvin.sendMessage(from, { image: { url: res.data.url  }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})
  
//=====================================================================
malvin({
    pattern: "megumin",
    alias: ["imgmegumin"],
    react: '💕',
    desc: "Download anime megumin images.",
    category: "anime",
    use: '.megumin',
    filename: __filename
},
async(malvin, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let res = await axios.get('https://api.waifu.pics/sfw/megumin')
let wm = `❤️‍🔥Random megumin image

 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`
await malvin.sendMessage(from, { image: { url: res.data.url }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})

//================================================================
malvin({
    pattern: "maid",
    alias: ["imgmaid"],
    react: '💫',
    desc: "Download anime maid images.",
    category: "anime",
    use: '.maid',
    filename: __filename
},
async(malvin, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let res = await axios.get('https://api.waifu.im/search/?included_tags=maid')
let wm = `😎 Random maid image

©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴍᴀʟᴠɪɴ ᴋɪɴʜ`
await malvin.sendMessage(from, { image: { url: res.data.images[0].url  }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})

//=====================================================================
malvin({
    pattern: "awoo",
    alias: ["imgawoo"],
    react: '😎',
    desc: "Download anime awoo images.",
    category: "anime",
    use: '.awoo',
    filename: __filename
},
async(malvin, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let res = await axios.get('https://api.waifu.pics/sfw/awoo')
let wm = `😎 Random awoo image

 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`
await malvin.sendMessage(from, { image: { url: res.data.url }, caption: wm}, { quoted: mek })
} catch (e) {
reply(cants)
console.log(e)
}
})
// Anmiex
malvin({
    pattern: "animegirl",
    desc: "Fetch a random anime girl image.",
    category: "anime",
    react: "🧚🏻",
    filename: __filename
},
async (malvin, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const apiUrl = `https://api.waifu.pics/sfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await malvin.sendMessage(from, { image: { url: data.url }, caption: '*ANIME GIRL IMAGE* 🥳\n\n\n *>  ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ`*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

malvin({
    pattern: "animegirl1",
    desc: "Fetch a random anime girl image.",
    category: "anime",
    react: "🧚🏻",
    filename: __filename
},
async (malvin, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const apiUrl = `https://api.waifu.pics/sfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await malvin.sendMessage(from, { image: { url: data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n >  ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

malvin({
    pattern: "animegirl2",
    desc: "Fetch a random anime girl image.",
    category: "anime",
    react: "🧚🏻",
    filename: __filename
},
async (malvin, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const apiUrl = `https://api.waifu.pics/sfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await malvin.sendMessage(from, { image: { url: data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n >  ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

malvin({
    pattern: "animegirl3",
    desc: "Fetch a random anime girl image.",
    category: "anime",
    react: "🧚🏻",
    filename: __filename
},
async (malvin, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const apiUrl = `https://api.waifu.pics/sfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await malvin.sendMessage(from, { image: { url: data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n >  ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

malvin({
    pattern: "animegirl4",
    desc: "Fetch a random anime girl image.",
    category: "anime",
    react: "🧚🏻",
    filename: __filename
},
async (malvin, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const apiUrl = `https://api.waifu.pics/sfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await malvin.sendMessage(from, { image: { url: data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n >  ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

malvin({
    pattern: "animegirl5",
    desc: "Fetch a random anime girl image.",
    category: "anime",
    react: "🧚🏻",
    filename: __filename
},
async (malvin, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const apiUrl = `https://api.waifu.pics/sfw/waifu`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await malvin.sendMessage(from, { image: { url: data.url }, caption: 'ANIME GIRL IMAGE 👾\n\n\n >  ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`*Error Fetching Anime Girl image*: ${e.message}`);
    }
});

malvin({
    pattern: "dog",
    desc: "Fetch a random dog image.",
    category: "anime",
    react: "🐶",
    filename: __filename
},
async (malvin, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const apiUrl = `https://dog.ceo/api/breeds/image/random`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        await malvin.sendMessage(from, { image: { url: data.message }, caption: '> * ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ ' }, { quoted: mek });
    } catch (e) {
        console.log(e); // ❯❯ Powered by MALVIN XD 👑
        reply(`єяяσя ƒєт¢нιηg ∂σg ιмαgє: ${e.message}`);
    }
});

malvin({
    pattern: "cat",
    desc: "Fetch a random cat image.",
    category: "anime",
    react: "🐱",
    filename: __filename
},
async (malvin, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        // API URL to fetch a random cat image
        const apiUrl = `https://api.thecatapi.com/v1/images/search`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        // Send the cat image with a caption
        await malvin.sendMessage(from, { image: { url: data[0].url }, caption: '𝐌𝐀𝐋𝐕𝐈𝐍 𝐗𝐃 DOWNLOAD CAT 🐈 PICS\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*' }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`Error Fetching Cat Image 🤕: ${e.message}`);
    }
});