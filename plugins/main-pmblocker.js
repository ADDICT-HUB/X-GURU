const { malvin } = require('../malvin');
const config = require('../settings');

malvin({
    pattern: "pmblock",
    alias: ["pmblocker"],
    desc: "Enable or disable private message blocking for non-owners.",
    category: "security",
    filename: __filename,
    usage: "pmblock [on/off]",
    react: "🚫",
    ownerOnly: true
}, async (malvin, mek, m, { args, reply }) => {
    const action = args[0]?.toLowerCase();

    if (!action || !['on', 'off'].includes(action)) {
        return reply(`
❓ *Invalid Usage*

🛠️ *Usage:* \`.pmblock on\` or \`.pmblock off\`
📌 *Description:* Enable or disable PM blocking for non-owners.
        `.trim());
    }

    config.PM_BLOCKER = action === "on" ? "true" : "false";

    return reply(
        action === "on"
        ? "🚫 *PM Blocker Enabled!*\n\n🛡️ The bot will now ignore private messages from non-owners."
        : "✅ *PM Blocker Disabled!*\n\n💬 All users can now message the bot privately."
    );
});
