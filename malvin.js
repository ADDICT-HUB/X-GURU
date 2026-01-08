var commands = [];

function malvin(info, func) {
    var data = info;
    data.function = func;
    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!info.desc) info.desc = '';
    if (!data.fromMe) data.fromMe = false;
    if (!info.category) data.category = 'misc';
    if(!info.filename) data.filename = "Not Provided";
    commands.push(data);
    return data;
}

// ========== WORKING TEST COMMANDS ==========

// Test command - Always responds
malvin({
    pattern: 'ping',
    desc: 'Test if bot is alive',
    filename: __filename,
    category: 'test'
}, async (message, malvin, m, tools) => {
    try {
        const start = Date.now();
        const text = `🏓 Pong!\n🚀 Speed: ${Date.now() - start}ms\n👤 You are: ${tools?.isOwner ? 'Owner 🎖️' : 'User 👤'}\n📱 Your number: ${tools?.senderNumber || 'Unknown'}\n🤖 Bot number: ${malvin.user?.id?.split(':')[0] || 'Unknown'}`;
        
        await malvin.sendMessage(message.chat, { text: text }, { quoted: message });
        console.log('✅ Ping command executed successfully');
    } catch (error) {
        console.error('❌ Ping command error:', error);
        await malvin.sendMessage(message.chat, { text: '❌ Error executing ping command' }, { quoted: message });
    }
});

// Menu command
malvin({
    pattern: 'menu',
    desc: 'Show bot menu',
    filename: __filename,
    category: 'general'
}, async (message, malvin, m, tools) => {
    try {
        const prefix = tools?.prefix || '.';
        const text = `🎮 *XGURU BOT MENU*\n\n🏓 *${prefix}ping* - Test bot response\n👤 *${prefix}owner* - Show owner info\n🔧 *${prefix}help* - Show help\n🧪 *${prefix}test* - Bot status test\n⚙️ *${prefix}mode* - Show bot mode\n\n👑 *Owner:* ${tools?.isOwner ? 'You ✅' : 'Not you ❌'}\n🔤 *Prefix:* ${prefix}\n📱 *Your number:* ${tools?.senderNumber || 'Unknown'}`;
        
        await malvin.sendMessage(message.chat, { text: text }, { quoted: message });
        console.log('✅ Menu command executed successfully');
    } catch (error) {
        console.error('❌ Menu command error:', error);
    }
});

// Owner command
malvin({
    pattern: 'owner',
    desc: 'Show owner information',
    filename: __filename,
    category: 'info'
}, async (message, malvin, m, tools) => {
    try {
        const text = `👑 *OWNER INFORMATION*\n\n📱 *Bot Number:* ${malvin.user?.id?.split(':')[0] || 'Unknown'}\n👤 *Your Number:* ${tools?.senderNumber || 'Unknown'}\n🎖️ *You are Owner:* ${tools?.isOwner ? 'YES ✅' : 'NO ❌'}\n🔤 *Prefix:* ${tools?.prefix || '.'}\n💬 _Contact owner for support_`;
        
        await malvin.sendMessage(message.chat, { text: text }, { quoted: message });
        console.log('✅ Owner command executed successfully');
    } catch (error) {
        console.error('❌ Owner command error:', error);
    }
});

// Test command with full info
malvin({
    pattern: 'test',
    desc: 'Test bot functionality',
    filename: __filename,
    category: 'test'
}, async (message, malvin, m, tools) => {
    try {
        const config = require('./settings');
        const text = `🧪 *BOT TEST RESULTS*\n\n✅ Message handler: WORKING\n✅ Command parser: WORKING\n✅ Owner check: ${tools?.isOwner ? 'PASS' : 'FAIL'}\n✅ Response system: WORKING\n✅ Session: ACTIVE\n\n📊 *Debug Info:*\n- From JID: ${message.chat}\n- Sender: ${message.sender || 'Unknown'}\n- Is Group: ${message.isGroup ? 'YES' : 'NO'}\n- Prefix: ${tools?.prefix || '.'}\n- Mode: ${config.MODE || 'not set'}\n- Owner: ${tools?.isOwner ? 'YES' : 'NO'}`;
        
        await malvin.sendMessage(message.chat, { text: text }, { quoted: message });
        console.log('✅ Test command executed successfully');
    } catch (error) {
        console.error('❌ Test command error:', error);
    }
});

// Mode command
malvin({
    pattern: 'mode',
    desc: 'Show bot mode',
    filename: __filename,
    category: 'info'
}, async (message, malvin, m, tools) => {
    try {
        const config = require('./settings');
        const currentMode = config.MODE || 'public';
        const text = `⚙️ *BOT MODE SETTINGS*\n\n📊 Current Mode: ${currentMode}\n👤 You are: ${tools?.isOwner ? 'Owner 👑' : 'User 👤'}\n🔑 Mode affects who can use commands:\n\n• public: Everyone can use\n• private: Only owner\n• inbox: Only private chats\n• groups: Only groups\n\nCheck settings.js to change mode.`;
        
        await malvin.sendMessage(message.chat, { text: text }, { quoted: message });
        console.log('✅ Mode command executed successfully');
    } catch (error) {
        console.error('❌ Mode command error:', error);
    }
});

// Help command
malvin({
    pattern: 'help',
    desc: 'Show help information',
    filename: __filename,
    category: 'general'
}, async (message, malvin, m, tools) => {
    try {
        const prefix = tools?.prefix || '.';
        const text = `📚 *XGURU BOT HELP*\n\n🔧 *Basic Commands:*\n• ${prefix}ping - Test bot response\n• ${prefix}menu - Show menu\n• ${prefix}owner - Owner information\n• ${prefix}test - Bot status test\n• ${prefix}mode - Show bot mode\n• ${prefix}help - This help message\n\n👑 *Owner Status:* ${tools?.isOwner ? 'YES ✅' : 'NO ❌'}\n📱 *Your number:* ${tools?.senderNumber || 'Unknown'}\n🔤 *Prefix:* ${prefix}\n\n💬 *Support:* Contact bot owner for help`;
        
        await malvin.sendMessage(message.chat, { text: text }, { quoted: message });
        console.log('✅ Help command executed successfully');
    } catch (error) {
        console.error('❌ Help command error:', error);
    }
});

// Alive command
malvin({
    pattern: 'alive',
    desc: 'Check if bot is alive',
    filename: __filename,
    category: 'test'
}, async (message, malvin, m, tools) => {
    try {
        const uptime = process.uptime();
        const days = Math.floor(uptime / (24 * 60 * 60));
        const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((uptime % (60 * 60)) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const text = `🤖 *XGURU BOT IS ALIVE!*\n\n⏱️ *Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s\n👑 *Owner:* ${tools?.isOwner ? 'You ✅' : 'Not you ❌'}\n📱 *Your number:* ${tools?.senderNumber || 'Unknown'}\n🔤 *Prefix:* ${tools?.prefix || '.'}\n✅ *Bot is fully operational!*`;
        
        await malvin.sendMessage(message.chat, { text: text }, { quoted: message });
        console.log('✅ Alive command executed successfully');
    } catch (error) {
        console.error('❌ Alive command error:', error);
    }
});

// Reset command (Owner only)
malvin({
    pattern: 'reset',
    desc: 'Reset bot session (Owner only)',
    filename: __filename,
    category: 'owner',
    fromMe: true
}, async (message, malvin, m, tools) => {
    try {
        if (!tools?.isOwner) {
            const text = `🚫 Only owner can reset the session!\n\n🔍 Your number: ${tools?.senderNumber || 'Unknown'}\n🤖 Bot number: ${malvin.user?.id?.split(':')[0] || 'Unknown'}\n👑 Owner status: NO\n\nPlease check sudo.json or contact bot developer.`;
            await malvin.sendMessage(message.chat, { text: text }, { quoted: message });
            console.log('❌ Reset command denied - Not owner');
            return;
        }
        
        const text = `🔄 Resetting session...\n⚠️ The bot will restart and you may need to scan QR code again.\n\nPlease wait...`;
        await malvin.sendMessage(message.chat, { text: text }, { quoted: message });
        console.log('✅ Reset command approved - Session reset initiated');
        
        // Import and call resetSession
        const { resetSession } = require('../index');
        setTimeout(() => {
            resetSession();
        }, 2000);
    } catch (error) {
        console.error('❌ Reset command error:', error);
    }
});

// Addowner command (Owner only)
malvin({
    pattern: 'addowner',
    desc: 'Add new owner (Owner only)',
    filename: __filename,
    category: 'owner',
    fromMe: true
}, async (message, malvin, m, tools) => {
    try {
        if (!tools?.isOwner) {
            await malvin.sendMessage(message.chat, { text: '🚫 Only current owner can add new owners!' }, { quoted: message });
            return;
        }
        
        const newOwner = tools?.q || tools?.args?.[0];
        if (!newOwner) {
            await malvin.sendMessage(message.chat, { text: `❌ Please provide a number: ${tools?.prefix || '.'}addowner 1234567890` }, { quoted: message });
            return;
        }
        
        const fs = require('fs');
        let ownerFile = [];
        
        try {
            if (fs.existsSync("./lib/sudo.json")) {
                const content = fs.readFileSync("./lib/sudo.json", "utf-8");
                if (content.trim()) {
                    ownerFile = JSON.parse(content);
                }
            }
            
            const newOwnerJid = newOwner.includes('@') ? newOwner : newOwner + '@s.whatsapp.net';
            
            if (ownerFile.includes(newOwnerJid)) {
                await malvin.sendMessage(message.chat, { text: `✅ ${newOwnerJid} is already an owner.` }, { quoted: message });
                return;
            }
            
            ownerFile.push(newOwnerJid);
            fs.writeFileSync("./lib/sudo.json", JSON.stringify(ownerFile, null, 2));
            
            await malvin.sendMessage(message.chat, { text: `✅ Added ${newOwnerJid} as owner!\n🔁 Please restart bot for changes to take effect.` }, { quoted: message });
            
        } catch (e) {
            await malvin.sendMessage(message.chat, { text: `❌ Error adding owner: ${e.message}` }, { quoted: message });
        }
    } catch (error) {
        console.error('❌ Addowner command error:', error);
    }
});

module.exports = {
    malvin,
    AddCommand: malvin,
    Function: malvin,
    Module: malvin,
    commands,
};
