//---------------------------------------------
//           MALVIN-XD  
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const { malvin, commands } = require('../malvin');
const axios = require('axios');

/**
 * Fetches a pairing code for the MALVIN-XD bot.
 * @param {Object} malvin - The bot instance.
 * @param {Object} mek - The message object.
 * @param {Object} m - Message metadata and utilities.
 * @param {Object} params - Destructured parameters (from, args, q, senderNumber, reply, quoted).
 */
malvin({
    pattern: 'pair',
    alias: ['getpair', 'clonebot'],
    react: '✅',
    desc: 'Get pairing code for bot',
    category: 'download',
    use: '.pair 254xx',
    filename: __filename
}, async (malvin, mek, m, { from, quoted, args, q, senderNumber, reply }) => {
    try {
        // Extract and clean phone number
        const phoneNumber = (q ? q.trim() : senderNumber).replace(/[^0-9]/g, '');

        // Validate phone number
        if (!phoneNumber || phoneNumber.length < 10 || phoneNumber.length > 15) {
            return reply(
                '❌ *Invalid phone number!*\n\n' +
                'Please provide a 10-15 digit phone number (no `+`).\n' +
                'Example: `.pair 254xx`'
            );
        }
        // Validate country code (optional, e.g., 263 for Zimbabwe)
        if (!/^(263|1|91)/.test(phoneNumber)) {
            return reply(
                '❌ *Unsupported country code!*\n\n' +
                'Use a number starting with a valid code (e.g., 263 for Zimbabwe, 1 for USA, 91 for India).'
            );
        }

        // Make API request
        const response = await axios.get(`https://session-v35f.onrender.com/code?number=${encodeURIComponent(phoneNumber)}`);

        // Validate response
        if (!response.data || typeof response.data !== 'object' || !response.data.code) {
            return reply('❌ *Failed to retrieve pairing code.*\nPlease try again later.');
        }

        const pairingCode = response.data.code;

        // Send formatted response
        await reply(
            `*PAIRING CODE*\n\n` +
            `🔹 *Phone Number:* ${phoneNumber}\n` +
            `🔹 *Pairing Code:* ${pairingCode}\n` +
            `🔹 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ* `
        );

        // Send clean code after 2-second delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        await reply(pairingCode);

    } catch (error) {
        console.error('Pair command error:', error);
        if (error.response?.status === 429) {
            return reply('❌ *Rate limit exceeded!*\nPlease try again later.');
        } else if (error.response?.status >= 500) {
            return reply('❌ *API server unavailable!*\nPlease try again later.');
        }
        return reply(`❌ *Failed to get pairing code.*\nError: ${error.message || 'Unknown error. Please try again.'}`);
    }
});

// Code by Malvin King