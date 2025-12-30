const { malvin } = require("../malvin");
const axios = require("axios");
const fs = require("fs");

malvin({
  pattern: "fluxai",
  alias: ["flux", "imagine"],
  react: "🚀",
  desc: "Generate an image using AI.",
  category: "ai",
  filename: __filename
}, async (malvin, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("Please provide a prompt for the image.");

    await reply("> *CREATING IMAGINE ...🔥*");

    const apiUrl = `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(q)}`;

    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    if (!response || !response.data) {
      return reply("Error: The API did not return a valid image. Try again later.");
    }

    const imageBuffer = Buffer.from(response.data, "binary");

    await malvin.sendMessage(m.chat, {
      image: imageBuffer,
      caption: `💸 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ* 🚀\n✨ Prompt: *${q}*`
    });

  } catch (error) {
    console.error("FluxAI Error:", error);
    reply(`An error occurred: ${error.response?.data?.message || error.message || "Unknown error"}`);
  }
});

malvin({
  pattern: "stablediffusion",
  alias: ["sdiffusion", "imagine2"],
  react: "🚀",
  desc: "Generate an image using AI.",
  category: "ai",
  filename: __filename
}, async (malvin, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("Please provide a prompt for the image.");

    await reply("> *CREATING IMAGINE ...🔥*");

    const apiUrl = `https://api.siputzx.my.id/api/ai/stable-diffusion?prompt=${encodeURIComponent(q)}`;

    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    if (!response || !response.data) {
      return reply("Error: The API did not return a valid image. Try again later.");
    }

    const imageBuffer = Buffer.from(response.data, "binary");

    await malvin.sendMessage(m.chat, {
      image: imageBuffer,
      caption: `💸 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*🚀\n✨ Prompt: *${q}*`
    });

  } catch (error) {
    console.error("FluxAI Error:", error);
    reply(`An error occurred: ${error.response?.data?.message || error.message || "Unknown error"}`);
  }
});

malvin({
  pattern: "stabilityai",
  alias: ["stability", "imagine3"],
  react: "🚀",
  desc: "Generate an image using AI.",
  category: "ai",
  filename: __filename
}, async (malvin, mek, m, { q, reply }) => {
  try {
    if (!q) return reply("Please provide a prompt for the image.");

    await reply("> *Generating...🔥*");

    const apiUrl = `https://api.siputzx.my.id/api/ai/stabilityai?prompt=${encodeURIComponent(q)}`;

    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    if (!response || !response.data) {
      return reply("Error: The API did not return a valid image. Try again later.");
    }

    const imageBuffer = Buffer.from(response.data, "binary");

    await malvin.sendMessage(m.chat, {
      image: imageBuffer,
      caption: `💸 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*🚀\n✨ Prompt: *${q}*`
    });

  } catch (error) {
    console.error("FluxAI Error:", error);
    reply(`An error occurred: ${error.response?.data?.message || error.message || "Unknown error"}`);
  }
});
