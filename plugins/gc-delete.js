const { malvin } = require('../malvin')

malvin({
  pattern: "delete",
  alias: ["del", "d"],
  react: "🗑️",
  desc: "Delete messages",
  category: "utility",
  filename: __filename
}, async (malvin, mek, m, { reply, isGroup, isAdmins, isOwner }) => {
  try {
    if (!m.quoted) return reply("❌ Please reply to a message to delete it!");

    // For groups - check admin status
    if (isGroup && !isAdmins && !isOwner) {
      return reply("❌ You need admin rights to delete messages in groups!");
    }

    // Delete the quoted message
    const deleteParams = {
      remoteJid: m.chat,
      id: m.quoted.id,
      participant: m.quoted.sender,
      fromMe: m.quoted.fromMe // Preserve original ownership
    };

    await malvin.sendMessage(m.chat, { delete: deleteParams });

    // Delete the command message (optional)
    await malvin.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: true,
        id: m.id
      }
    });

  } catch (e) {
    console.error('Delete error:', e);
    reply(`❌ Failed to delete message! ${e.message}`);
  }
})
