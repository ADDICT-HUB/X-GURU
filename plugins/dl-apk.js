const axios = require("axios");
const { malvin } = require("../malvin");

malvin({
  pattern: "apk",
  alias: ["modapk", "apkdownload"],
  react: '📦',
  desc: "Download APK files using NexOracle API.",
  category: "download",
  use: ".apk <app name>",
  filename: __filename
}, async (malvin, mek, m, { from, reply, args }) => {
  try {
    // Check if the user provided an app name
    const appName = args.join(" ");
    if (!appName) {
      return reply('Please provide an app name. Example: `.apk whatsapp `');
    }

    // Add a reaction to indicate processing
    await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // Prepare the NexOracle API URL
    const apiUrl = `https://api.nexoracle.com/downloader/apk`;
    const params = {
      apikey: 'free_key@maher_apis', // Replace with your API key if needed
      q: appName, // App name to search for
    };

    // Call the NexOracle API using GET
    const response = await axios.get(apiUrl, { params });

    // Check if the API response is valid
    if (!response.data || response.data.status !== 200 || !response.data.result) {
      return reply('❌ Unable to find the APK. Please try again later.');
    }

    // Extract the APK details
    const { name, lastup, package, size, icon, dllink } = response.data.result;

    // Send a message with the app thumbnail and "Downloading..." text
    await malvin.sendMessage(from, {
      image: { url: icon }, // App icon as thumbnail
      caption: `📦 *Downloading ${name}... Please wait.*`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363299029326322@newsletter',
          newsletterName: '𝖒𝖆𝖗𝖎𝖘𝖊𝖑',
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

    // Download the APK file
    const apkResponse = await axios.get(dllink, { responseType: 'arraybuffer' });
    if (!apkResponse.data) {
      return reply('❌ Failed to download the APK. Please try again later.');
    }

    // Prepare the APK file buffer
    const apkBuffer = Buffer.from(apkResponse.data, 'binary');

    // Prepare the message with APK details
    const message = `📦 *ᴀᴘᴋ ᴅᴇᴛᴀɪʟs*📦:\n\n` +
      `🔖 *Nᴀᴍᴇ*: ${name}\n` +
      `📅 *Lᴀsᴛ ᴜᴘᴅᴀᴛᴇ*: ${lastup}\n` +
      `📦 *Pᴀᴄᴋᴀɢᴇ*: ${package}\n` +
      `📏 *Sɪᴢᴇ*: ${size}\n\n` +
      `> ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ`;

    // Send the APK file as a document
    await malvin.sendMessage(from, {
      document: apkBuffer,
      mimetype: 'application/vnd.android.package-archive',
      fileName: `${name}.apk`,
      caption: message,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363299029326322@newsletter',
          newsletterName: '𝖒𝖆𝖗𝖎𝖘𝖊𝖑',
          serverMessageId: 143
        }
      }
    }, { quoted: mek });

    // Add a reaction to indicate success
    await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });
  } catch (error) {
    console.error('Error fetching APK details:', error);
    reply('❌ Unable to fetch APK details. Please try again later.');

    // Add a reaction to indicate failure
    await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});