const fs = require('fs');
const path = require('path');
const config = require('../settings');
const { malvin } = require('../malvin');

// Auto Typing + Auto Reply + Message Logging
malvin({
    on: 'body'
}, async (malvin, mek, m, { from, body, isOwner }) => {
    try {
        if (!body) return; // skip empty messages

        // 1️⃣ Show typing if enabled
        if (config.AUTO_TYPING === 'true') {
            await malvin.sendPresenceUpdate('composing', from);
        }

        // 2️⃣ Log every message
        console.log(`[MESSAGE DETECTED] From: ${from}, Text: "${body}"`);

        // 3️⃣ Check for auto-reply
        if (config.AUTO_REPLY === 'true') {
            const filePath = path.join(__dirname, '../autos/autoreply.json');
            if (!fs.existsSync(filePath)) return;

            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const msgText = body.toLowerCase();

            for (const key in data) {
                if (msgText === key.toLowerCase()) {
                    await m.reply(data[key]);
                    break; // stop after first match
                }
            }
        }

    } catch (e) {
        console.error('Auto-reply/typing error:', e);
    }
});
