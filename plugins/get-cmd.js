const { malvin, commands } = require('../malvin');
const fs = require('fs');
const path = require('path');

malvin({
    pattern: "get",
    alias: ["source", "js"],
    desc: "Fetch the full source code of a command",
    category: "owner",
    react: "📜",
    filename: __filename
},
async (malvin, mek, m, { from, args, reply, sender }) => {
    try {
        // Strict JID restriction
        const allowedJid = "254740007567@s.whatsapp.net";
        if (sender !== allowedJid) {
            return reply("❌ Access Denied! This command is restricted.");
        }

        if (!args[0]) return reply("❌ Please provide a command name. Example: `.get alive`");

        const commandName = args[0].toLowerCase();
        const commandData = commands.find(malvin => malvin.pattern === commandName || (malvin.alias && malvin.alias.includes(commandName)));

        if (!commandData) return reply("❌ Command not found!");

        // Get the command file path
        const commandPath = commandData.filename;

        // Read the full source code
        const fullCode = fs.readFileSync(commandPath, 'utf-8');

        // Truncate long messages for WhatsApp
        let truncatedCode = fullCode;
        if (truncatedCode.length > 4000) {
            truncatedCode = fullCode.substring(0, 4000) + "\n\n// Code too long, sending full file 📂";
        }

        // Formatted caption with truncated code
        const formattedCode = `───〔 *📜 Command Source* 〕───
\`\`\`js
${truncatedCode}
\`\`\`
╰──────────⊷  
⚡ Full file sent below 📂  
> ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ`;

        // Send image with truncated source code
        await malvin.sendMessage(from, { 
            image: { url: config.MENU_IMAGE_URL || 'https://url.bwmxmd.online/Adams.xm472dqv.jpeg' },
            caption: formattedCode,
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

        // Send full source file
        const fileName = `${commandName}.js`;
        const tempPath = path.join(__dirname, fileName);
        fs.writeFileSync(tempPath, fullCode);

        await malvin.sendMessage(from, { 
            document: fs.readFileSync(tempPath),
            mimetype: 'text/javascript',
            fileName: fileName
        }, { quoted: mek });

        // Delete the temporary file
        fs.unlinkSync(tempPath);

    } catch (e) {
        console.error("Error in .get command:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
