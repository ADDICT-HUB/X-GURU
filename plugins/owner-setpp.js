const { malvin } = require("../malvin");
const Jimp = require("jimp");

malvin({
  pattern: "fullpp",
  alias: ["setpp", "setdp", "pp"],
  desc: "Set a full image as bot's profile picture",
  react: "🖼️",
  category: "tools",
  filename: __filename,
}, async (malvin, m, match, { from, isCreator }) => {
  try {
    const botJid = malvin.user?.id?.split(":")[0] + "@s.whatsapp.net";

    // Allow only bot owner or bot itself
    if (m.sender !== botJid && !isCreator) {
      return await malvin.sendMessage(from, {
        text: "*🚫 Only the bot owner or the bot itself can use this command.*",
      }, { quoted: m });
    }

    if (!m.quoted || !m.quoted.mtype?.includes("image")) {
      return await malvin.sendMessage(from, {
        text: "*⚠️ Please reply to an image to set as profile picture.*"
      }, { quoted: m });
    }

    await malvin.sendMessage(from, {
      text: "*🖼️ Processing image, please wait...*"
    }, { quoted: m });

    const mediaBuffer = await m.quoted.download();
    const image = await Jimp.read(mediaBuffer);

    // Resize and blur background
    const blurred = image.clone().cover(640, 640).blur(8);
    const centered = image.clone().contain(640, 640);
    blurred.composite(centered, 0, 0);

    const processedImage = await blurred.getBufferAsync(Jimp.MIME_JPEG);

    // Upload profile picture
    await malvin.updateProfilePicture(botJid, processedImage);

    await malvin.sendMessage(from, {
      text: "*✅ Bot profile picture updated successfully!*"
    }, { quoted: m });

  } catch (err) {
    console.error("FullPP Error:", err);
    await malvin.sendMessage(from, {
      text: `*❌ Failed to update profile picture:*\n${err.message}`
    }, { quoted: m });
  }
});
