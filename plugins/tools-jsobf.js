//---------------------------------------------
//           MALVIN-XD  
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const config = require('../settings');
const { malvin, commands } = require('../malvin');
const JavaScriptObfuscator = require('javascript-obfuscator');
const axios = require('axios');

const THUMBNAIL_URL = 'https://i.ibb.co/pjGZNcgX/malvin-xd.jpg';

/**
 * Obfuscates JavaScript code using an external API.
 * @param {Object} malvin - The bot instance.
 * @param {Object} mek - The message object.
 * @param {Object} m - Message metadata and utilities.
 * @param {Object} params - Destructured parameters (from, q, reply, quoted).
 */
malvin({
    pattern: 'obfuscate2',
    alias: ['obf2', 'encrypt2'],
    react: '🔒',
    desc: 'Obfuscate JavaScript code using an external API.',
    category: 'tools',
    use: '<javascript code>',
    filename: __filename
}, async (malvin, mek, m, { from, q, reply, quoted }) => {
    try {
        if (!q || q.length < 1) {
            return reply(
                '❌ *No code provided!*\n\n' +
                'Please provide JavaScript code to obfuscate.\n' +
                'Example: `.obfuscate2 console.log("Hello");`'
            );
        }
        if (q.length > 10000) {
            return reply('❌ *Code too long!*\n\nPlease provide code under 10,000 characters.');
        }

        await reply('⏳ Obfuscating...');

        const encodedCode = encodeURIComponent(q);
        const apiUrl = `https://api.giftedtech.web.id/api/tools/encryptv3?apikey=gifted&code=${encodedCode}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.result?.encrypted_code) {
            return reply('❌ *Failed to obfuscate code.*\nPlease try again later.');
        }

        const obfuscatedCode = data.result.encrypted_code;

        await malvin.sendMessage(from, {
            text: `🔒 *OBFUSCATOR*\n\n` +
                  `🔹 *Original Length:* ${q.length} characters\n` +
                  `🔹 *Obfuscated Code:* ${obfuscatedCode}\n\n` +
                  `⚠️ *Do not share sensitive code!*\n` +
                  `🔹 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`,
            contextInfo: {
                externalAdReply: {
                    title: 'Obfuscator',
                    body: 'JavaScript Code Protection',
                    thumbnail: await axios.get(THUMBNAIL_URL, { responseType: 'arraybuffer' })
                        .then(res => res.data)
                        .catch(() => null),
                    mediaType: 2
                }
            }
        }, { quoted });

        // Send clean code after 2-second delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        await reply(obfuscatedCode);

    } catch (error) {
        console.error('Obfuscate2 error:', error);
        if (error.response?.status === 429) {
            return reply('❌ *Rate limit exceeded!*\nPlease try again later.');
        } else if (error.response?.status >= 500) {
            return reply('❌ *API server unavailable!*\nPlease try again later.');
        }
        return reply(`❌ *Failed to obfuscate code.*\nError: ${error.response?.data?.message || error.message}`);
    }
});

/**
 * Obfuscates JavaScript code locally using javascript-obfuscator.
 * @param {Object} malvin - The bot instance.
 * @param {Object} mek - The message object.
 * @param {Object} m - Message metadata and utilities.
 * @param {Object} params - Destructured parameters (from, args, reply, quoted).
 */
malvin({
    pattern: 'obfuscate',
    alias: ['obf', 'confuse'],
    desc: 'Obfuscate JavaScript code to make it harder to read.',
    category: 'utility',
    use: '.obfuscate <code> [light|medium|heavy]',
    filename: __filename
}, async (malvin, mek, m, { from, args, reply, quoted }) => {
    try {
        const code = args.join(' ');
        if (!code) {
            return reply(
                '❌ *No code provided!*\n\n' +
                'Please provide JavaScript code to obfuscate.\n' +
                'Example: `.obfuscate console.log("Hello"); medium`'
            );
        }
        if (code.length > 10000) {
            return reply('❌ *Code too long!*\n\nPlease provide code under 10,000 characters.');
        }

        // Validate JavaScript syntax
        try {
            new Function(code);
        } catch (syntaxError) {
            return reply(`❌ *Invalid JavaScript code!*\nError: ${syntaxError.message}`);
        }

        // Determine obfuscation strength
        const strength = (args[0] && !isNaN(args[0])) ? args[1]?.toLowerCase() || 'medium' : args[0]?.toLowerCase() || 'medium';
        const validStrengths = ['light', 'medium', 'heavy'];
        if (!validStrengths.includes(strength)) {
            return reply(
                '❌ *Invalid strength!*\n\n' +
                'Use one of: light, medium, heavy.\n' +
                'Example: `.obfuscate console.log("Hello"); medium`'
            );
        }

        const options = {
            light: { compact: true },
            medium: { compact: true, controlFlowFlattening: true, stringArray: true, stringArrayEncoding: ['base64'] },
            heavy: {
                compact: true,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                debugProtection: true,
                disableConsoleOutput: true,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                rotateStringArray: true
            }
        }[strength];

        const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, options).getObfuscatedCode();

        await reply(
            `🔒 *OBFUSCATOR*\n\n` +
            `🔹 *Original Length:* ${code.length} characters\n` +
            `🔹 *Strength:* ${strength}\n` +
            `🔹 *Obfuscated Code:* ${obfuscatedCode}\n\n` +
            `⚠️ *Do not share sensitive code!*\n` +
            `🔹 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`
        );

        // Send clean code after 2-second delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        await reply(obfuscatedCode);

    } catch (error) {
        console.error('Obfuscate error:', error);
        return reply(`❌ *Failed to obfuscate code.*\nError: ${error.message || 'Unknown error. Please try again.'}`);
    }
});

/**
 * Attempts to format obfuscated JavaScript code (limited functionality).
 * @param {Object} malvin - The bot instance.
 * @param {Object} mek - The message object.
 * @param {Object} m - Message metadata and utilities.
 * @param {Object} params - Destructured parameters (from, args, reply, quoted).
 */
malvin({
    pattern: 'deobfuscate',
    alias: ['deobf', 'unconfuse'],
    desc: 'Attempt to format obfuscated JavaScript code (limited functionality).',
    category: 'utility',
    use: '.deobfuscate <obfuscated_code>',
    filename: __filename
}, async (malvin, mek, m, { from, args, reply, quoted }) => {
    try {
        const code = args.join(' ');
        if (!code) {
            return reply(
                '❌ *No code provided!*\n\n' +
                'Please provide obfuscated JavaScript code to format.\n' +
                'Example: `.deobfuscate var _0xabc=[...];`'
            );
        }
        if (code.length > 10000) {
            return reply('❌ *Code too long!*\n\nPlease provide code under 10,000 characters.');
        }

        // Validate JavaScript syntax
        try {
            new Function(code);
        } catch (syntaxError) {
            return reply(`❌ *Invalid JavaScript code!*\nError: ${syntaxError.message}`);
        }

        // Basic formatting (add newlines and spaces)
        const formattedCode = code
            .replace(/;/g, ';\n')
            .replace(/{/g, '{\n')
            .replace(/}/g, '\n}')
            .replace(/,/g, ', ')
            .replace(/\s+/g, ' ')
            .trim();

        await reply(
            `🔓 *FORMATTER*\n\n` +
            `⚠️ *Note:* Full deobfuscation is not possible; this formats the code for readability.\n` +
            `🔹 *Formatted Code:* ${formattedCode}\n\n` +
            `🔹 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ`
        );

        // Send clean code after 2-second delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        await reply(formattedCode);

    } catch (error) {
        console.error('Deobfuscate error:', error);
        return reply(`❌ *Failed to format code.*\nError: ${error.message || 'Unknown error. Please try again.'}`);
    }
});

// Code by Malvin King