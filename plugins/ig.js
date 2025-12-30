const axios = require("axios");
const { malvin } = require("../malvin");

malvin({
  pattern: "igdl",
  alias: ["instagram", "ig", "instadl"],
  react: '📥',
  desc: "Download Instagram posts (images or videos).",
  category: "download",
  use: ".igdl <Instagram post URL>",
  filename: __filename
}, async (malvin, mek, m, { from, reply, args }) => {
  try {
    // Check if the user provided an Instagram URL
    const igUrl = args[0];
    if (!igUrl || !igUrl.includes("instagram.com")) {
      return reply('Please provide a valid Instagram post URL. Example: `.igdl https://www.instagram.com/p/Cxxxxxxxxxx/`');
    }

    // Add a reaction to indicate processing
    await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // Prepare the API URL
    const apiUrl = `https://api.giftedtech.web.id/api/download/instadl?apikey=gifted&url=${encodeURIComponent(igUrl)}`;

    // Call the API using GET
    const response = await axios.get(apiUrl);

    // Check if the API response is valid
    if (!response.data || response.data.status !== true || !response.data.result) {
      return reply('❌ Unable to fetch the post. Please check the URL and try again.');
    }

    // Extract the post details
    const postData = response.data.result;
    const username = postData.username || "unknown";
    const caption = postData.caption || "No caption";
    const mediaType = postData.type || "image";
    const mediaUrls = Array.isArray(postData.url) ? postData.url : [postData.url];
    
    // Get like and comment counts if available
    const likeCount = postData.like || postData.like_count || 0;
    const commentCount = postData.comment || postData.comment_count || 0;

    // Inform the user that the post is being downloaded
    await reply(`📥 *Downloading Instagram ${mediaType} by @${username}... Please wait.*`);

    // Download and send each media item
    for (const mediaUrl of mediaUrls) {
      try {
        const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        if (!mediaResponse.data) {
          console.error('Failed to download media from URL:', mediaUrl);
          continue; // Skip to next media if this one fails
        }

        const mediaBuffer = Buffer.from(mediaResponse.data, 'binary');

        if (mediaType === "video" || mediaType === "reel") {
          // Send as video
          await malvin.sendMessage(from, {
            video: mediaBuffer,
            caption: `📥 *Instagram ${mediaType === "reel" ? "Reel" : "Video"}*\n\n` +
              `👤 *Username*: @${username}\n` +
              `❤️ *Likes*: ${likeCount}\n` +
              `💬 *Comments*: ${commentCount}\n` +
              `📝 *Caption*: ${caption}\n\n` +
              `> ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ`,
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 999,
              isForwarded: true
            }
          }, { quoted: mek });
        } else {
          // Send as image
          await malvin.sendMessage(from, {
            image: mediaBuffer,
            caption: `📥 *Instagram Post*\n\n` +
              `👤 *Username*: @${username}\n` +
              `❤️ *Likes*: ${likeCount}\n` +
              `💬 *Comments*: ${commentCount}\n` +
              `📝 *Caption*: ${caption}\n\n` +
              `> ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ`,
            contextInfo: {
              mentionedJid: [m.sender],
              forwardingScore: 999,
              isForwarded: true
            }
          }, { quoted: mek });
        }
      } catch (mediaError) {
        console.error('Error downloading media:', mediaError);
        await reply(`❌ Failed to download one of the media items. Continuing with others...`);
      }
    }

    // Add a reaction to indicate success
    await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });
  } catch (error) {
    console.error('Error downloading Instagram post:', error);
    reply('❌ Unable to download the post. Please try again later.');

    // Add a reaction to indicate failure
    await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});
