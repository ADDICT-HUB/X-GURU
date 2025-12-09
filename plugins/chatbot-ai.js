const axios = require('axios');
const { malvin, commands } = require('../malvin');
const config = require("../settings");
const { setConfig, getConfig } = require("../lib/configdb");

// Default AI state if not set
let AI_ENABLED = "false";
// Message memory for conversation context
let messageMemory = new Map();
const MAX_MEMORY = 150; // Maximum messages to remember per chat

// Initialize AI state on startup
(async () => {
    const savedState = await getConfig("AI_ENABLED");
    if (savedState) AI_ENABLED = savedState;
})();

malvin({
    pattern: "aichat",
    alias: ["chatbot", "bot"],
    desc: "Enable or disable AI chatbot responses",
    category: "settings",
    filename: __filename,
    react: "✅"
}, async (malvin, mek, m, { from, args, isOwner, reply }) => {
    if (!isOwner) return reply("*Only the owner can use this command!*");

    const status = args[0]?.toLowerCase();
    if (status === "on") {
        AI_ENABLED = "true";
        await setConfig("AI_ENABLED", "true");
        return reply("🤖 AI chatbot is now enabled");
    } else if (status === "off") {
        AI_ENABLED = "false";
        await setConfig("AI_ENABLED", "false");
        return reply("🤖 AI chatbot is now disabled");
    } else {
        return reply(`Current AI state: ${AI_ENABLED === "true" ? "ON" : "OFF"}\nUsage: ${config.PREFIX}aichat on/off`);
    }
});

// Function to manage conversation memory
function updateMemory(chatId, message, isUser = true) {
    if (!messageMemory.has(chatId)) {
        messageMemory.set(chatId, []);
    }
    
    const chatMemory = messageMemory.get(chatId);
    chatMemory.push({
        role: isUser ? "user" : "assistant",
        content: message,
        timestamp: Date.now()
    });
    
    // Keep only the last MAX_MEMORY messages
    if (chatMemory.length > MAX_MEMORY) {
        messageMemory.set(chatId, chatMemory.slice(-MAX_MEMORY));
    }
}

// AI Chatbot 
malvin({
    on: "body"
}, async (malvin, m, store, {
    from,
    body,
    sender,
    isGroup,
    isBotAdmins,
    isAdmins,
    reply
}) => {
    try {
        // Check if AI is disabled
        if (AI_ENABLED !== "true") return;

        // Prevent bot responding to its own messages or commands
        if (!body || m.key.fromMe || body.startsWith(config.PREFIX)) return;

        // Show "typing..." indicator
        await malvin.sendPresenceUpdate('composing', from);

        // Add user message to memory
        updateMemory(from, body, true);

        // Check if user is asking about creator
        const isAskingAboutCreator = /(who made you|who created you|who is your (creator|developer|owner)|who are you|what are you)/i.test(body);
        
        let response;
        
        if (isAskingAboutCreator) {
            // Special response for creator questions
            response = "I am Marisel AI, created by Marisel - a brilliant mind from Kenya with exceptional coding skills and vision. She's the mastermind behind my existence, crafting me with precision and care to be your helpful assistant.";
        } else {
            // Get conversation context
            const context = messageMemory.has(from) 
                ? messageMemory.get(from).map(msg => `${msg.role}: ${msg.content}`).join('\n')
                : `user: ${body}`;

            // Create prompt with context and instructions
            const prompt = `You are Marisel AI, a powerful WhatsApp bot developed by Marisel from Kenya. 
            You respond smartly, confidently, and stay loyal to your creator. 
            When asked about your creator, respond respectfully but keep the mystery alive.
            If someone is being abusive, apologize and say "Let's begin afresh."
            
            Previous conversation context:
            ${context}
            
            Current message: ${body}
            
            Respond as Marisel AI:`;

            // Encode the prompt for the API
            const query = encodeURIComponent(prompt);
            
            // Use the API endpoint
            const apiUrl = `https://api.giftedtech.web.id/api/ai/ai?apikey=gifted&q=${query}`;

            const { data } = await axios.get(apiUrl);
            
            if (data && data.result) {
                response = data.result;
            } else if (data && data.message) {
                response = data.message;
            } else {
                response = "I'm sorry, I couldn't process that request. Let's begin afresh.";
            }
        }

        // Add footer to response
        const finalResponse = `${response}\n\n> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*`;
        
        // Add AI response to memory
        updateMemory(from, response, false);
        
        await malvin.sendMessage(from, {
            text: finalResponse
        }, { quoted: m });

    } catch (err) {
        console.error("AI Chatbot Error:", err.message);
        reply("❌ An error occurred while contacting the AI. Let's begin afresh.");
    }
});
