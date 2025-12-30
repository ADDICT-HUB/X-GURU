const axios = require("axios");
const { malvin } = require("../malvin");

malvin({
  pattern: "igimagedl",
  alias: ["instagramimages", "igimages","igimage"],
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
      return reply('Please provide a valid Instagram post URL. Example: `.igdl https://instagram.com/...`');
    }

    // Add a reaction to indicate processing
    await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // Prepare the API URL with the new endpoint
    const apiUrl = `https://apis.davidcyriltech.my.id/instagram?url=${encodeURIComponent(igUrl)}`;

    // Call the API using GET
    const response = await axios.get(apiUrl);

    // Check if the API response is valid
    if (!response.data || response.data.status !== 200 || !response.data.data) {
      return reply('❌ Unable to fetch the post. Please check the URL and try again.');
    }

    // Extract the post details from the new API response format
    const postData = response.data.data;
    const username = postData.username || "unknown";
    const caption = postData.caption || "No caption";
    const mediaUrls = postData.media || [];
    const isVideo = postData.type === "video";
    const likeCount = postData.like_count || 0;
    const commentCount = postData.comment_count || 0;

    // Inform the user that the post is being downloaded
    await reply(`📥 *Downloading Instagram post by @${username}... Please wait.*`);

    // Download and send each media item
    for (const mediaUrl of mediaUrls) {
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      if (!mediaResponse.data) {
        return reply('❌ Failed to download the media. Please try again later.');
      }

      const mediaBuffer = Buffer.from(mediaResponse.data, 'binary');

      if (isVideo) {
        // Send as video
        await malvin.sendMessage(from, {
          video: mediaBuffer,
          caption: `📥 *Instagram Post*\n\n` +
            `👤 *Username*: @${username}\n` +
            `❤️ *Likes*: ${likeCount}\n` +
            `💬 *Comments*: ${commentCount}\n` +
            `📝 *Caption*: ${caption}\n\n` +
            `> ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ`,
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '1120363299029326322@newsletter',
              newsletterName: '𝖒𝖆𝖗𝖎𝖘𝖊𝖑',
              serverMessageId: 143
            }
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
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363402507750390@newsletter',
              newsletterName: '『 ᴍᴀʟᴠɪɴ-xᴅ 』',
              serverMessageId: 143
            }
          }
        }, { quoted: mek });
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

// VIDEO SECTION
malvin({
  pattern: "igvid",
  alias: ["igvideo","ig","instagram", "igdl"],
  react: '📥',
  desc: "Download Instagram videos.",
  category: "download",
  use: ".igvid <Instagram video URL>",
  filename: __filename
}, async (malvin, mek, m, { from, reply, args }) => {
  try {
    // Check if the user provided an Instagram video URL
    const igUrl = args[0];
    if (!igUrl || !igUrl.includes("instagram.com")) {
      return reply('Please provide a valid Instagram video URL. Example: `.igvid https://instagram.com/...`');
    }

    // Add a reaction to indicate processing
    await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });

    // Prepare the API URL with the new endpoint
    const apiUrl = `https://apis.davidcyriltech.my.id/instagram?url=${encodeURIComponent(igUrl)}`;

    // Call the API using GET
    const response = await axios.get(apiUrl);

    // Check if the API response is valid
    if (!response.data || response.data.status !== 200 || !response.data.data) {
      return reply('❌ Unable to fetch the video. Please check the URL and try again.');
    }

    // Extract the video details from the new API response format
    const postData = response.data.data;
    const username = postData.username || "unknown";
    const caption = postData.caption || "No caption";
    const mediaUrls = postData.media || [];
    const isVideo = postData.type === "video";
    const likeCount = postData.like_count || 0;
    const commentCount = postData.comment_count || 0;

    if (!isVideo) {
      return reply('❌ The provided URL is not a video. Use .igimagedl for images.');
    }

    // Inform the user that the video is being downloaded
    await reply(`📥 *Downloading Instagram video by @${username}... Please wait.*`);

    // Download and send each video
    for (const mediaUrl of mediaUrls) {
      const videoResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      if (!videoResponse.data) {
        return reply('❌ Failed to download the video. Please try again later.');
      }

      const videoBuffer = Buffer.from(videoResponse.data, 'binary');

      // Send the video
      await malvin.sendMessage(from, {
        video: videoBuffer,
        caption: `📥 *Instagram Video*\n\n` +
          `👤 *Username*: @${username}\n` +
          `❤️ *Likes*: ${likeCount}\n` +
          `💬 *Comments*: ${commentCount}\n` +
          `📝 *Caption*: ${caption}\n\n` +
          `> ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ`,
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
    }

    // Add a reaction to indicate success
    await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });
  } catch (error) {
    console.error('Error downloading Instagram video:', error);
    reply('❌ Unable to download the video. Please try again later.');

    // Add a reaction to indicate failure
    await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
  }
});
