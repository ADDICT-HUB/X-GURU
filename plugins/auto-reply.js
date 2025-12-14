const fs = require('fs');
const path = require('path');
const config = require('../settings');
const { malvin } = require('../malvin');

// Auto-reply with message logging
malvin({
    on: 'body' // triggers on every text message
}, async (malvin, mek, m, { from, body, isOwner }) => {
    try {
        if (!body) return; // skip if message is empty

        // Log every message
        console.log(`[MESSAGE DETECTED] From: ${from}, Text: "${body}"`);

        const filePath = path.join(__dirname, '../autos/autoreply.json');

        if (!fs.existsSync(filePath)) return;

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const msgText = body.toLowerCase();

        // Find matching auto-reply
        for (const key in data) {
            if (msgText === key.toLowerCase()) {
                if (config.AUTO_REPLY === 'true') {
                    // Optionally skip owner messages
                    // if (isOwner) return;

                    await m.reply(data[key]); // reply with stored response
                }
                break; // stop after first match
            }
        }
    } catch (e) {
        console.error('Auto-reply error:', e);
    }
});
