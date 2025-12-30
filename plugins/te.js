const config = require('../settings');
const moment = require('moment-timezone');
const { malvin, commands } = require('../malvin');
const { runtime } = require('../lib/functions');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

// Tiny caps mapping for lowercase letters (same as alive command)
const tinyCapsMap = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
  j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'q', r: 'ʀ',
  s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};

// Function to convert string to tiny caps (same as alive command)
const toTinyCaps = (str) => {
  return str
    .split('')
    .map((char) => tinyCapsMap[char.toLowerCase()] || char)
    .join('');
};

// Configuration constants
const MENU_IMG = config.MENU_IMAGE_URL || 'https://url.bwmxmd.online/Adams.zjrmnw18.jpeg';
const NEWSLETTER_JID = config.NEWSLETTER_JID || '120363299029326322@newsletter';
const MENU_AUDIO = config.MENU_AUDIO_URL || 'https://files.catbox.moe/pjlpd7.mp3';

// Normalisation des catégories
const normalize = (str) => str.toLowerCase().replace(/\s+menu$/, '').trim();

// Emojis par catégorie normalisée
const emojiByCategory = {
  ai: '🤖',
  anime: '🍥',
  audio: '🎧',
  bible: '📖',
  download: '⬇️',
  downloader: '📥',
  fun: '🎮',
  game: '🕹️',
  group: '👥',
  img_edit: '🖌️',
  info: 'ℹ️',
  information: '🧠',
  logo: '🖼️',
  main: '🏠',
  media: '🎞️',
  menu: '📜',
  misc: '📦',
  music: '🎵',
  other: '📁',
  owner: '👑',
  privacy: '🔒',
  search: '🔎',
  settings: '⚙️',
  sticker: '🌟',
  tools: '🛠️',
  user: '👤',
  utilities: '🧰',
  utility: '🧮',
  wallpapers: '🖼️',
  whatsapp: '📱',
};

// Function to create menu navigation buttons
function createMenuNavigation(categories, prefix) {
  const sections = [];
  const rows = [];
  
  for (const cat of Object.keys(categories).sort()) {
    const emoji = emojiByCategory[cat] || '💫';
    const title = `${emoji} ${toTinyCaps(cat)}`;
    const description = `${toTinyCaps(cat)} ${toTinyCaps('Menu')}`;
    
    rows.push({
      title: title,
      rowId: `${prefix}${cat}-menu`,
      description: description
    });
  }
  
  // Add additional utility buttons like in alive command
  rows.push(
    {
      title: "🔙 Back",
      rowId: `${prefix}menu`,
      description: "Return to main menu"
    },
    {
      title: "🚀 Alive",
      rowId: `${prefix}alive`,
      description: "Check bot status"
    },
    {
      title: "👑 Owner",
      rowId: `${prefix}owner`,
      description: "Contact bot owner"
    }
  );
  
  sections.push({
    title: "Menu Navigation",
    rows: rows
  });
  
  return {
    text: toTinyCaps("mercedes bot menu"),
    footer: "Select a category to explore commands",
    title: toTinyCaps("mercedes bot menu"),
    buttonText: "Browse Categories",
    sections: sections
  };
}

malvin({
  pattern: 'meu',
  alias: ['allmenu', 'help', 'commands'],
  desc: 'Show all bot commands',
  category: 'menu',
  react: '📜',
  filename: __filename
}, async (malvin, mek, m, { from, sender, reply, pushname }) => {
  try {
    const prefix = getPrefix();
    const timezone = config.TIMEZONE || 'Africa/Nairobi';
    const time = moment().tz(timezone).format('HH:mm:ss');
    const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

    const uptime = runtime(process.uptime());
    const usedRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);

    let menu = `
*┏─〔 ${pushname || sender.split("@")[0]} 〕─⊷*
*┇ ᴜᴘᴛɪᴍᴇ: ${uptime}*
*┇ ʙᴏᴛ ɴᴀᴍᴇ: ${config.BOT_NAME}*
*┇ ᴏᴡɴᴇʀ: ${config.OWNER_NAME}*
*┇ ᴘʀᴇғɪx: 「 ${prefix} 」*
*┇ ᴘʟᴜɢɪɴꜱ: 『 ${commands.length} 』*
*┇ ᴍᴏᴅᴇ: ${config.MODE}*
*┇ ᴠᴇʀꜱɪᴏɴ: 2.0.0*
*┗──────────────⊷*

${toTinyCaps('select a category below to explore commands')}
`.trim();

    // Group commands by category
    const categories = {};
    for (const cmd of commands) {
      if (cmd.category && !cmd.dontAdd && cmd.pattern) {
        const normalizedCategory = normalize(cmd.category);
        categories[normalizedCategory] = categories[normalizedCategory] || [];
        categories[normalizedCategory].push(cmd.pattern.split('|')[0]);
      }
    }

    // Create menu navigation
    const listMessage = createMenuNavigation(categories, prefix);

    // Context info for image message (same style as alive command)
    const imageContextInfo = {
      mentionedJid: [sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: NEWSLETTER_JID,
        newsletterName: toTinyCaps(config.OWNER_NAME || 'marisel'),
        serverMessageId: 143
      }
    };

    // Send menu image with navigation buttons
    await malvin.sendMessage(
      from,
      {
        image: { url: MENU_IMG },
        caption: menu,
        ...listMessage,
        contextInfo: imageContextInfo
      },
      { quoted: mek }
    );

    // Send audio if configured (same as alive command)
    if (MENU_AUDIO) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await malvin.sendMessage(
        from,
        {
          audio: { url: MENU_AUDIO },
          mimetype: 'audio/mp4',
          ptt: true,
          contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: NEWSLETTER_JID,
              newsletterName: toTinyCaps(config.OWNER_NAME || 'marisel'),
              serverMessageId: 143
            }
          }
        },
        { quoted: mek }
      );
    }

  } catch (e) {
    console.error('❌ Menu Error:', e.message);
    await malvin.sendMessage(from, { react: { text: "❌", key: mek.key } });
    const errorMessage = toTinyCaps(`
      An error occurred while processing the menu command.
      Error Details: ${e.message}
      Please report this issue or try again later.
    `).trim();
    return reply(errorMessage);
  }
});

// Handle sub-menu commands (category-menu)
for (const category of Object.keys(emojiByCategory)) {
  malvin({
    pattern: `${category}-menu`,
    desc: `Show ${category} commands`,
    category: 'menu',
    filename: __filename
  }, async (malvin, mek, m, { from, sender, reply, pushname }) => {
    try {
      const prefix = getPrefix();
      
      // Group commands by category
      const categories = {};
      for (const cmd of commands) {
        if (cmd.category && !cmd.dontAdd && cmd.pattern) {
          const normalizedCategory = normalize(cmd.category);
          categories[normalizedCategory] = categories[normalizedCategory] || [];
          categories[normalizedCategory].push(cmd.pattern.split('|')[0]);
        }
      }
      
      // Check if category exists
      if (!categories[category]) {
        await reply(`❌ ${toTinyCaps('Error')}: ${toTinyCaps('Category')} "${category}" ${toTinyCaps('not found')}.`);
        return;
      }
      
      const emoji = emojiByCategory[category] || '💫';
      const categoryTitle = `${emoji} ${toTinyCaps(category)} ${toTinyCaps('Menu')}`;
      
      let subMenu = `
*┏─〔 ${pushname || sender.split("@")[0]} 〕─⊷*
*┇ ᴄᴀᴛᴇɢᴏʀʏ: ${toTinyCaps(category)}*
*┇ ᴄᴏᴍᴍᴀɴᴅꜱ: ${categories[category].length}*
*┗──────────────⊷*

*${categoryTitle}*
`.trim();

      for (const cmd of categories[category].sort()) {
        subMenu += `\n• ${prefix}${cmd}`;
      }
      
      // Create back button
      const buttons = [
        {
          buttonId: "back",
          buttonText: { displayText: "🔙 ʙᴀᴄᴋ ᴛᴏ ᴍᴀɪɴ ᴍᴇɴᴜ" },
          type: 1
        }
      ];
      
      // Send sub-menu
      await malvin.sendMessage(
        from,
        {
          text: subMenu,
          buttons: buttons,
          headerType: 1,
          contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 999,
            isForwarded: true
          }
        },
        { quoted: mek }
      );
      
    } catch (e) {
      console.error('❌ Sub-Menu Error:', e.message);
      await malvin.sendMessage(from, { react: { text: "❌", key: mek.key } });
      await reply(`❌ ${toTinyCaps('Error')}: ${toTinyCaps('Failed to show')} ${category} ${toTinyCaps('menu')}. ${toTinyCaps('Try again')}.`);
    }
  });
}

// Handle button responses
malvin({
  on: 'message'
}, async (malvin, mek, m) => {
  try {
    const prefix = getPrefix();
    const from = mek.key.remoteJid;
    
    // Check for button responses
    if (mek.message?.buttonsResponseMessage) {
      const selectedId = mek.message.buttonsResponseMessage.selectedButtonId;
      
      if (selectedId === "back") {
        // Simulate the menu command
        const simulatedMessage = {
          ...mek,
          body: `${prefix}menu`
        };
        // Find and execute the menu handler
        for (const handler of malvin.handlers) {
          if (handler.pattern === 'menu') {
            await handler.func(malvin, simulatedMessage, m, {
              from: from,
              sender: mek.key.participant || from,
              pushname: mek.pushName || "User",
              reply: (text) => malvin.sendMessage(from, { text: text }, { quoted: mek })
            });
            break;
          }
        }
        return;
      }
      
      if (selectedId) {
        // Handle menu navigation
        if (selectedId.endsWith('-menu')) {
          // Simulate the menu command
          const simulatedMessage = {
            ...mek,
            body: selectedId
          };
          // Find and execute the corresponding handler
          for (const handler of malvin.handlers) {
            if (handler.pattern === selectedId.replace(prefix, '')) {
              await handler.func(malvin, simulatedMessage, m, {
                from: from,
                sender: mek.key.participant || from,
                pushname: mek.pushName || "User",
                reply: (text) => malvin.sendMessage(from, { text: text }, { quoted: mek })
              });
              break;
            }
          }
          return;
        }
        
        // Handle direct command execution
        if (selectedId.startsWith(prefix)) {
          const commandName = selectedId.slice(prefix.length);
          
          // Find and execute the command
          for (const handler of malvin.handlers) {
            if (handler.pattern === commandName || 
                (handler.alias && handler.alias.includes(commandName))) {
              await handler.func(malvin, mek, m, {
                from: from,
                sender: mek.key.participant || from,
                pushname: mek.pushName || "User",
                reply: (text) => malvin.sendMessage(from, { text: text }, { quoted: mek })
              });
              break;
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('❌ Button Response Error:', e.message);
  }
});
