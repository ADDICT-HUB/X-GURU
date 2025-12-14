const axios = require('axios');
const config = require('../settings');
const { malvin } = require('../malvin');

let bioInterval;
const defaultBio = config.AUTO_BIO_TEXT || "X-GURU | Quote: {quote} | Time: {time}";
const quoteApiUrl = config.QUOTE_API_URL || 'https://apis.davidcyriltech.my.id/random/quotes';
const updateInterval = config.AUTO_BIO_INTERVAL || 30 * 1000; // Default 30 seconds

// Fallback quotes
const fallbackQuotes = [
    "Stay curious, keep learning!",
    "Dream big, work hard!",
    "The best is yet to come.",
    "Keep it real, always.",
    "Life is a journey, enjoy it!"
];

// Get Kenya time
function getKenyaTime() {
    const options = {
        timeZone: 'Africa/Nairobi',
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    };
    return new Date().toLocaleString('en-US', options);
}

// Start auto-bio updates
async function startAutoBio(malvin, bioText) {
    stopAutoBio();

    async function updateBio() {
        try {
            const quote = await fetchQuote();
            const kenyaTime = getKenyaTime();
            const formattedBio = bioText
                .replace('{quote}', quote)
                .replace('{time}', kenyaTime);
            await malvin.updateProfileStatus(formattedBio);
            console.log(`✅ Auto-bio updated: ${formattedBio}`);
        } catch (err) {
            console.error('❌ Bio update error:', err.message);
        }
    }

    // Update immediately
    await updateBio();

    // Set interval
    bioInterval = setInterval(updateBio, updateInterval);
}

// Stop auto-bio updates
function stopAutoBio() {
    if (bioInterval) {
        clearInterval(bioInterval);
        bioInterval = null;
    }
}

// Fetch random quote
async function fetchQuote() {
    try {
        const response = await axios.get(quoteApiUrl);
        if (response.status === 200 && response.data.content) return response.data.content;
        throw new Error('Invalid quote API response');
    } catch {
        return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    }
}

// Command to toggle auto-bio manually
malvin({
    pattern: 'autobio',
    alias: ['autoabout'],
    desc: 'Toggle automatic bio updates with random quotes and Kenya time',
    category: 'misc',
    filename: __filename,
    usage: `${config.PREFIX}autobio [on/off] [text]`
}, async (malvin, mek, m, { args, reply, isOwner }) => {
    if (!isOwner) return reply("❌ Only the bot owner can use this command.");

    const [action, ...bioParts] = args;
    const customBio = bioParts.join(' ') || defaultBio;

    try {
        if (action === 'on') {
            if (config.AUTO_BIO === "true") return reply("ℹ️ Auto-bio is already enabled.");
            config.AUTO_BIO = "true";
            config.AUTO_BIO_TEXT = customBio;
            await startAutoBio(malvin, customBio);
            return reply(`✅ Auto-bio enabled!\nCurrent text: "${customBio}"`);
        } else if (action === 'off') {
            if (config.AUTO_BIO !== "true") return reply("ℹ️ Auto-bio is already disabled.");
            config.AUTO_BIO = "false";
            stopAutoBio();
            return reply("✅ Auto-bio disabled.");
        } else {
            return reply(
                `╭━━〔 🤖 Auto-Bio Settings 〕━━┈⊷\n` +
                `│\n` +
                `│ Usage:\n` +
                `│ ➸ ${config.PREFIX}autobio on [text] - Enable auto-bio with custom text\n` +
                `│ ➸ ${config.PREFIX}autobio off - Disable auto-bio\n` +
                `│\n` +
                `│ Placeholders:\n` +
                `│ ➸ {quote} - Random quote\n` +
                `│ ➸ {time} - Kenya time & date\n` +
                `│\n` +
                `│ Status: ${config.AUTO_BIO === "true" ? 'ON' : 'OFF'}\n` +
                `│ Current Text: "${config.AUTO_BIO_TEXT || defaultBio}"\n` +
                `│ Kenya Time: ${getKenyaTime()}\n` +
                `╰──────────────┈⊷`
            );
        }
    } catch (error) {
        console.error('❌ Auto-bio error:', error.message);
        return reply("❌ Failed to update auto-bio settings.");
    }
});

// Auto-start auto-bio on bot launch
module.exports.init = async (malvin) => {
    if (config.AUTO_BIO === "true") {
        const bioText = config.AUTO_BIO_TEXT || defaultBio;
        await startAutoBio(malvin, bioText);
    }
};
