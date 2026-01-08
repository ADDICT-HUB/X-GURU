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

// ========== WORKING COMMANDS WITH CORRECT PARAMETER ORDER ==========
// In your system, the order is: (malvin, message, m, tools)
// NOT: (message, malvin, m, tools)

// Test command
malvin({
    pattern: 'ping',
    desc: 'Test if bot is alive',
    filename: __filename,
    category: 'test'
}, async (malvin, message, m, tools) => {
    try {
        const start = Date.now();
        console.log('✅ Ping command executing...');
        
        const text = `🏓 Pong!\n🚀 Speed: ${Date.now() - start}ms\n👤 You are: ${tools?.isOwner ? 'Owner 🎖️' : 'User 👤'}\n📱 Your number: ${tools?.senderNumber || 'Unknown'}\n🤖 Bot number: ${malvin.user?.id?.split(':')[0] || 'Unknown'}`;
        
        await malvin.sendMessage(message.chat || tools?.from, { 
            text: text 
        }, { quoted: message });
        
        console.log('✅ Ping response sent');
        return true;
    } catch (error) {
        console.error('❌ Ping command error:', error.message);
        try {
            await malvin.sendMessage(message.chat || tools?.from, { 
                text: '❌ Error executing ping command' 
            }, { quoted: message });
        } catch (e) {
            console.error('Failed to send error message:', e.message);
        }
    }
});

// Menu command
malvin({
    pattern: 'menu',
    desc: 'Show bot menu',
    filename: __filename,
    category: 'general'
}, async (malvin, message, m, tools) => {
    try {
        console.log('✅ Menu command executing...');
        const prefix = tools?.prefix || '.';
        const text = `🎮 *XGURU BOT MENU*\n\n🏓 *${prefix}ping* - Test bot response\n👤 *${prefix}owner* - Show owner info\n🔧 *${prefix}help* - Show help\n🧪 *${prefix}test* - Bot status test\n⚙️ *${prefix}mode* - Show bot mode\n\n👑 *Owner:* ${tools?.isOwner ? 'You ✅' : 'Not you ❌'}\n🔤 *Prefix:* ${prefix}\n📱 *Your number:* ${tools?.senderNumber || 'Unknown'}`;
        
        await malvin.sendMessage(message.chat || tools?.from, { 
            text: text 
        }, { quoted: message });
        
        console.log('✅ Menu response sent');
        return true;
    } catch (error) {
        console.error('❌ Menu command error:', error.message);
    }
});

// Owner command
malvin({
    pattern: 'owner',
    desc: 'Show owner information',
    filename: __filename,
    category: 'info'
}, async (malvin, message, m, tools) => {
    try {
        console.log('✅ Owner command executing...');
        const text = `👑 *OWNER INFORMATION*\n\n📱 *Bot Number:* ${malvin.user?.id?.split(':')[0] || 'Unknown'}\n👤 *Your Number:* ${tools?.senderNumber || 'Unknown'}\n🎖️ *You are Owner:* ${tools?.isOwner ? 'YES ✅' : 'NO ❌'}\n🔤 *Prefix:* ${tools?.prefix || '.'}\n💬 _Contact owner for support_`;
        
        await malvin.sendMessage(message.chat || tools?.from, { 
            text: text 
        }, { quoted: message });
        
        console.log('✅ Owner response sent');
        return true;
    } catch (error) {
        console.error('❌ Owner command error:', error.message);
    }
});

// Test command with full info
malvin({
    pattern: 'test',
    desc: 'Test bot functionality',
    filename: __filename,
    category: 'test'
}, async (malvin, message, m, tools) => {
    try {
        console.log('✅ Test command executing...');
        const config = require('./settings');
        const text = `🧪 *BOT TEST RESULTS*\n\n✅ Message handler: WORKING\n✅ Command parser: WORKING\n✅ Owner check: ${tools?.isOwner ? 'PASS' : 'FAIL'}\n✅ Response system: WORKING\n✅ Session: ACTIVE\n\n📊 *Debug Info:*\n- From JID: ${message.chat || tools?.from}\n- Sender: ${message.sender || tools?.sender || 'Unknown'}\n- Is Group: ${message.isGroup || tools?.isGroup ? 'YES' : 'NO'}\n- Prefix: ${tools?.prefix || '.'}\n- Mode: ${config.MODE || 'not set'}\n- Owner: ${tools?.isOwner ? 'YES' : 'NO'}`;
        
        await malvin.sendMessage(message.chat || tools?.from, { 
            text: text 
        }, { quoted: message });
        
        console.log('✅ Test response sent');
        return true;
    } catch (error) {
        console.error('❌ Test command error:', error.message);
    }
});

// Mode command
malvin({
    pattern: 'mode',
    desc: 'Show bot mode',
    filename: __filename,
    category: 'info'
}, async (malvin, message, m, tools) => {
    try {
        console.log('✅ Mode command executing...');
        const config = require('./settings');
        const currentMode = config.MODE || 'public';
        const text = `⚙️ *BOT MODE SETTINGS*\n\n📊 Current Mode: ${currentMode}\n👤 You are: ${tools?.isOwner ? 'Owner 👑' : 'User 👤'}\n🔑 Mode affects who can use commands:\n\n• public: Everyone can use\n• private: Only owner\n• inbox: Only private chats\n• groups: Only groups\n\nCheck settings.js to change mode.`;
        
        await malvin.sendMessage(message.chat || tools?.from, { 
            text: text 
        }, { quoted: message });
        
        console.log('✅ Mode response sent');
        return true;
    } catch (error) {
        console.error('❌ Mode command error:', error.message);
    }
});

// Help command
malvin({
    pattern: 'help',
    desc: 'Show help information',
    filename: __filename,
    category: 'general'
}, async (malvin, message, m, tools) => {
    try {
        console.log('✅ Help command executing...');
        const prefix = tools?.prefix || '.';
        const text = `📚 *XGURU BOT HELP*\n\n🔧 *Basic Commands:*\n• ${prefix}ping - Test bot response\n• ${prefix}menu - Show menu\n• ${prefix}owner - Owner information\n• ${prefix}test - Bot status test\n• ${prefix}mode - Show bot mode\n• ${prefix}help - This help message\n\n👑 *Owner Status:* ${tools?.isOwner ? 'YES ✅' : 'NO ❌'}\n📱 *Your number:* ${tools?.senderNumber || 'Unknown'}\n🔤 *Prefix:* ${prefix}\n\n💬 *Support:* Contact bot owner for help`;
        
        await malvin.sendMessage(message.chat || tools?.from, { 
            text: text 
        }, { quoted: message });
        
        console.log('✅ Help response sent');
        return true;
    } catch (error) {
        console.error('❌ Help command error:', error.message);
    }
});

// Alive command
malvin({
    pattern: 'alive',
    desc: 'Check if bot is alive',
    filename: __filename,
    category: 'test'
}, async (malvin, message, m, tools) => {
    try {
        console.log('✅ Alive command executing...');
        const uptime = process.uptime();
        const days = Math.floor(uptime / (24 * 60 * 60));
        const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((uptime % (60 * 60)) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const text = `🤖 *XGURU BOT IS ALIVE!*\n\n⏱️ *Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s\n👑 *Owner:* ${tools?.isOwner ? 'You ✅' : 'Not you ❌'}\n📱 *Your number:* ${tools?.senderNumber || 'Unknown'}\n🔤 *Prefix:* ${tools?.prefix || '.'}\n✅ *Bot is fully operational!*`;
        
        await malvin.sendMessage(message.chat || tools?.from, { 
            text: text 
        }, { quoted: message });
        
        console.log('✅ Alive response sent');
        return true;
    } catch (error) {
        console.error('❌ Alive command error:', error.message);
    }
});

// Fix sudo.json command
malvin({
    pattern: 'fixsudo',
    desc: 'Fix corrupted sudo.json file',
    filename: __filename,
    category: 'owner',
    fromMe: true
}, async (malvin, message, m, tools) => {
    try {
        console.log('✅ Fixsudo command executing...');
        
        if (!tools?.isOwner) {
            const text = `🚫 Only owner can fix sudo.json!\n\n🔍 Your number: ${tools?.senderNumber || 'Unknown'}\n👑 Owner status: NO`;
            await malvin.sendMessage(message.chat || tools?.from, { 
                text: text 
            }, { quoted: message });
            return;
        }
        
        const fs = require('fs');
        const defaultOwner = "218942841878@s.whatsapp.net";
        
        // Create fresh sudo.json
        const freshSudo = [defaultOwner];
        fs.writeFileSync("./lib/sudo.json", JSON.stringify(freshSudo, null, 2));
        
        const text = `✅ Fixed sudo.json!\n\n📁 Created fresh sudo.json with:\n👑 Owner: ${defaultOwner}\n\n🔁 The file was corrupted and has been reset.`;
        
        await malvin.sendMessage(message.chat || tools?.from, { 
            text: text 
        }, { quoted: message });
        
        console.log('✅ Sudo.json fixed');
        return true;
    } catch (error) {
        console.error('❌ Fixsudo command error:', error.message);
    }
});

// Reset command (Owner only)
malvin({
    pattern: 'reset',
    desc: 'Reset bot session (Owner only)',
    filename: __filename,
    category: 'owner',
    fromMe: true
}, async (malvin, message, m, tools) => {
    try {
        console.log('✅ Reset command executing...');
        
        if (!tools?.isOwner) {
            const text = `🚫 Only owner can reset the session!\n\n🔍 Your number: ${tools?.senderNumber || 'Unknown'}\n🤖 Bot number: ${malvin.user?.id?.split(':')[0] || 'Unknown'}\n👑 Owner status: NO\n\nPlease check sudo.json or contact bot developer.`;
            await malvin.sendMessage(message.chat || tools?.from, { 
                text: text 
            }, { quoted: message });
            console.log('❌ Reset command denied - Not owner');
            return;
        }
        
        const text = `🔄 Resetting session...\n⚠️ The bot will restart and you may need to scan QR code again.\n\nPlease wait...`;
        await malvin.sendMessage(message.chat || tools?.from, { 
            text: text 
        }, { quoted: message });
        console.log('✅ Reset command approved - Session reset initiated');
        
        // Import and call resetSession
        const { resetSession } = require('../index');
        setTimeout(() => {
            resetSession();
        }, 2000);
        return true;
    } catch (error) {
        console.error('❌ Reset command error:', error.message);
    }
});

module.exports = {
    malvin,
    AddCommand: malvin,
    Function: malvin,
    Module: malvin,
    commands,
};
