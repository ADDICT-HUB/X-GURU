const { malvin } = require('../malvin');
const { sleep } = require('../lib/functions');
const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const config = require('../settings');

const execPromise = promisify(exec);

malvin({
    pattern: 'restart',
    alias: ['reboot', 'refresh'],
    desc: 'Restart the MALVIN-XD bot system',
    category: 'system',
    react: '♻️',
    filename: __filename,
    ownerOnly: true
}, async (malvin, mek, m, { from, sender, reply, isCreator }) => {
    try {
        // Validate owner
        if (!isCreator) {
            return reply('❗ *Access Denied:*\nOnly the bot owner can use this command.');
        }

        // Initial Notification
        await reply(`
╭━━〔 *${config.BOT_NAME}* 〕━━┈⊷
│ 🔁 *Restart Initiated*
│ ⏰ *Starting in:* 3 seconds
│ 🛑 *Note:* Do not send commands until the bot is back online.
╰──────────────┈⊷
`.trim(), {
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.NEWSLETTER_JID || '120363299029326322@newsletter',
                    newsletterName: config.OWNER_NAME || '𝖒𝖆𝖗𝖎𝖘𝖊𝖑',
                    serverMessageId: 143
                }
            }
        });

        // Countdown
        await sleep(1000);
        await reply('⏳ *Restarting in 2...*', { contextInfo: { mentionedJid: [sender] } });
        await sleep(1000);
        await reply('⏳ *Restarting in 1...*', { contextInfo: { mentionedJid: [sender] } });
        await sleep(1000);

        // Final message before execution
        await reply(`
╭━━〔  *RESTARTING* 〕━━┈⊷
│ 🔌 *Estimated Downtime:* 15–20 seconds
│ 🧠 *Status:* Auto-reconnect will reactivate the bot
╰──────────────┈⊷
`.trim(), {
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.NEWSLETTER_JID || '120363299029326322@newsletter',
                    newsletterName: config.OWNER_NAME || '𝖒𝖆𝖗𝖎𝖘𝖊𝖑',
                    serverMessageId: 143
                }
            }
        });

        // Check if PM2 is available
        let pm2Available = false;
        try {
            execSync('pm2 --version', { stdio: 'ignore' });
            pm2Available = true;
        } catch (error) {
            // PM2 not found, proceed with process.exit
        }

        if (pm2Available) {
            // Execute PM2 restart
            const { stdout, stderr } = await execPromise('pm2 restart all');
            if (stderr) {
                console.error('PM2 Restart Warning:', stderr);
            }
            await reply(`
✅ *Restart Initiated Successfully*

📋 *Details:*
${stdout || 'PM2 is restarting all processes.'}

🔄 The bot will be back online shortly.
`.trim(), {
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.NEWSLETTER_JID || '120363299029326322@newsletter',
                        newsletterName: config.OWNER_NAME || '𝖒𝖆𝖗𝖎𝖘𝖊𝖑',
                        serverMessageId: 143
                    }
                }
            });
        } else {
            // Fallback to process.exit for Docker restart policy
            process.exit(0);
        }

    } catch (e) {
        console.error('Restart Failed:', e.stack);
        await reply(`
❌ *Restart Failed*

🚫 *Error:* ${e.message}

🔧 *Next Steps:*
1. If using PM2, verify it's installed:
   \`\`\`bash
   pm2 --version
   \`\`\`
2. If not using PM2, ensure Docker restart policy is set:
   \`\`\`bash
   docker run -d --restart=always --name mercedes
   \`\`\`
3. Contact @${config.OWNER_NAME || '𝖒𝖆𝖗𝖎𝖘𝖊𝖑'} for support.
`.trim(), {
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.NEWSLETTER_JID || '120363299029326322@newsletter',
                    newsletterName: config.OWNER_NAME || '𝖒𝖆𝖗𝖎𝖘𝖊𝖑',
                    serverMessageId: 143
                }
            }
        });
    }
});