//---------------------------------------------
//           MALVIN-XD  
//---------------------------------------------
//  ⚠️ DO NOT MODIFY THIS FILE OR REMOVE THIS CREDIT⚠️  
//---------------------------------------------

const crypto = require('crypto');
const { malvin } = require('../malvin');

/**
 * Generates a strong password with customizable length and character type.
 * @param {Object} malvin - The bot instance.
 * @param {Object} mek - The message object.
 * @param {Object} m - Message metadata and utilities.
 * @param {Object} params - Destructured parameters (from, args, q, reply, quoted).
 */
malvin({
    pattern: 'gpass',
    desc: 'Generate a strong password with customizable options.',
    category: 'other',
    react: '🔐',
    filename: __filename
}, async (malvin, mek, m, { from, args, q, reply, quoted }) => {
    try {
        // Parse inputs
        const passwordLength = args[0] ? parseInt(args[0]) : 12;
        const passwordType = (args[1] || 'all').toLowerCase();

        // Validate password length
        if (isNaN(passwordLength) || passwordLength < 8 || passwordLength > 128) {
            return reply(
                '❌ *Invalid password length!*\n\n' +
                'Please provide a length between 8 and 128 characters.\n' +
                'Example: `.gpass 12 all`'
            );
        }

        // Validate password type
        const validTypes = ['all', 'letters', 'numbers', 'symbols'];
        if (!validTypes.includes(passwordType)) {
            return reply(
                '❌ *Invalid password type!*\n\n' +
                'Use one of: all, letters, numbers, symbols.\n' +
                'Example: `.gpass 12 all`'
            );
        }

        // Character sets
        const sets = {
            letters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+[]{}|;:,.<>?'
        };

        // Select characters based on type
        let passwordChars = passwordType === 'letters' ? sets.letters :
                           passwordType === 'numbers' ? sets.numbers :
                           passwordType === 'symbols' ? sets.symbols :
                           sets.letters + sets.numbers + sets.symbols;

        // Generate password
        const generatePassword = (length, ensureDiversity = false) => {
            let password = '';
            if (ensureDiversity && passwordType === 'all') {
                // Ensure at least one character from each set
                password += sets.letters[crypto.randomInt(sets.letters.length)];
                password += sets.numbers[crypto.randomInt(sets.numbers.length)];
                password += sets.symbols[crypto.randomInt(sets.symbols.length)];
                length -= 3; // Reduce length to account for mandatory characters
            }
            for (let i = 0; i < length; i++) {
                const randomIndex = crypto.randomInt(0, passwordChars.length);
                password += passwordChars[randomIndex];
            }
            // Shuffle the password to avoid predictable patterns
            return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
        };

        const generatedPassword = generatePassword(passwordLength, passwordType === 'all');

        // Evaluate password strength
        let strength = 'Weak';
        if (passwordType !== 'all') {
            strength = passwordLength > 12 ? 'Medium' : 'Weak';
        } else {
            strength = passwordLength > 16 ? 'Very Strong' :
                      passwordLength > 12 ? 'Strong' : 'Medium';
        }

        // Send formatted response
        await reply(
            `🔐 *PASSWORD GENERATOR*\n\n` +
            `🔹 *Length:* ${passwordLength}\n` +
            `🔹 *Type:* ${passwordType}\n` +
            `🔹 *Strength:* ${strength}\n` +
            `🔹 *Password:* ${generatedPassword}\n\n` +
            `⚠️ *Do not share this password!*\n` +
            `🔹 *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ* 👑`
        );

        // Send clean password after 2-second delay for easy copying
        await new Promise(resolve => setTimeout(resolve, 2000));
        await reply(generatedPassword);

    } catch (error) {
        console.error('Gpass command error:', error);
        return reply(`❌ *Failed to generate password.*\nError: ${error.message || 'Unknown error. Please try again.'}`);
    }
});

// Code by Malvin King