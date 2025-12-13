const { malvin } = require('../malvin');
const config = require("../settings");

// Custom list of bad words
const badWords = [
  "wtf", "mia", "xxx", "fuck", "sex", "huththa", "pakaya", "ponnaya", "hutto"
];

// Patterns for blocked links including channel and invite links
const linkPatterns = [
  // WhatsApp groups
  /https?:\/\/chat\.whatsapp\.com\/\S+/gi,
  /wa\.me\/\S+/gi,
  // Telegram groups/channels
  /https?:\/\/t\.me\/\S+/gi,
  /https?:\/\/telegram\.me\/\S+/gi,
  // Social media links
  /https?:\/\/(?:www\.)?(youtube|facebook|instagram|twitter|tiktok|linkedin|snapchat|pinterest|reddit|discord|twitch|vimeo|dailymotion|medium)\.com\/\S+/gi,
  /https?:\/\/fb\.me\/\S+/gi,
  /https?:\/\/youtu\.be\/\S+/gi,
  // NGL links
  /https?:\/\/ngl\/\S+/gi,
  // Generic invite links (discord, slack, etc.)
  /https?:\/\/(?:discord|slack|invite)\.gg\/\S+/gi
];

malvin({
  on: "body"
}, async (malvin, m, store, { from, body, sender, isGroup, isAdmins, isBotAdmins, reply }) => {
  try {
    if (!isGroup || isAdmins || !isBotAdmins || sender === malvin.user?.id) return;

    const text = body.toLowerCase();
    const hasBadWord = config.ANTI_BAD_WORD === "true" && badWords.some(word => text.includes(word));
    const hasLink = config.ANTI_LINK === "true" && linkPatterns.some(pattern => pattern.test(body));

    const ownerName = config.OWNER_NAME || "GuruTech";
    const botName = config.BOT_NAME || "X-GURU";

    if (hasBadWord) {
      await malvin.sendMessage(from, { delete: m.key });
      await malvin.sendMessage(from, {
        text: `
╔══════════════════
║ 🚫 *${botName} Anti-BadWord!*
╟──────────────────
║ User: @${sender.split('@')[0]}
║ Action: Message deleted
║ Reason: Inappropriate language
╚══════════════════
`, 
        mentions: [sender]
      }, { quoted: m });
      return;
    }

    if (hasLink) {
      await malvin.sendMessage(from, { delete: m.key });
      await malvin.sendMessage(from, {
        text: `
╔══════════════════
║ ⚠️ *${botName} Anti-Link/Invite!*
╟──────────────────
║ User: @${sender.split('@')[0]}
║ Action: Removed from group
║ Reason: Posting prohibited links or invites
╚══════════════════
`, 
        mentions: [sender]
      }, { quoted: m });

      // Remove the user from the group
      await malvin.groupParticipantsUpdate(from, [sender], "remove");
    }
  } catch (error) {
    console.error(error);
    reply("❌ Error while processing message.");
  }
});
