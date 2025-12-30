const { malvin } = require('../malvin');

malvin({
  pattern: 'getjid2',
  alias: ['jid2'],
  desc: 'Get the WhatsApp JID of a user. Reply to a message or provide a number.',
  category: 'utility',
  filename: __filename
}, async (malvin, mek, m, { q, quoted, sender, reply }) => {
  try {
    let targetJid;
    
    // If replying to a message, get the sender of the quoted message
    if (m.quoted) {
      targetJid = m.quoted.sender;
    } 
    // Else if an argument is provided, assume it's a number or partial JID
    else if (q) {
      let number = q.replace(/[^0-9]/g, ''); // Keep only digits
      if (!number) {
        return reply("❌ Please provide a valid number.");
      }
      targetJid = number + '@s.whatsapp.net';
    } 
    // Otherwise, default to sender's own JID
    else {
      targetJid = sender;
    }
    
    await reply(`User JID: ${targetJid}`);
  } catch (error) {
    console.error("Error in getjid command:", error);
    await reply(`❌ Error: ${error}`);
  }
});
