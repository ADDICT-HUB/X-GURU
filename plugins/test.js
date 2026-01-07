const { malvin } = require('../malvin');

malvin({
  pattern: "test",
  desc: "Test if commands work",
  category: "general"
}, async (malvin, mek) => {
  await malvin.sendMessage(mek.key.remoteJid, { text: "✅ Commands are working! Prefix is " + require('../lib/prefix').getPrefix() }, { quoted: mek });
});
