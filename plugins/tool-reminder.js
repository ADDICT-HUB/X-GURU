const { malvin } = require('../malvin');
const config = require('../settings');
const axios = require('axios');

const prefix = config.PREFIX;

// Store active timers
const activeReminders = new Map();

// Reminder image URL
const REMINDER_IMAGE = 'https://files.catbox.moe/01f9y1.jpg';

malvin({
    pattern: "reminder",
    alias: ["remind", "remindme"],
    category: "utility",
    desc: "Sets a reminder with custom time duration",
    filename: __filename,
    usage: `${prefix}reminder <time> <message>\nExample: ${prefix}reminder 15minutes Check the oven`,
}, async (malvin, mek, m, { args, reply, sender }) => {
    try {
        if (args.length < 2) {
            return reply(`❌ Invalid format! Use:\n${prefix}reminder <time> <message>\nExample: ${prefix}reminder 15minutes Check the oven`);
        }

        // Extract time and unit
        const timeInput = args[0].toLowerCase();
        const message = args.slice(1).join(' ');
        
        // Parse time (support for: 10s, 5m, 2h, 30sec, 15min, 1hour, etc.)
        const timeMatch = timeInput.match(/^(\d+)(s|sec|seconds|m|min|minutes|h|hr|hours|hour)$/);
        
        if (!timeMatch) {
            return reply(`❌ Invalid time format! Examples:\n- 30s\n- 15min\n- 2h`);
        }

        const amount = parseInt(timeMatch[1]);
        const unit = timeMatch[2][0]; // Get first letter (s/m/h)

        // Convert to milliseconds
        let milliseconds;
        switch(unit) {
            case 's':
                milliseconds = amount * 1000;
                break;
            case 'm':
                milliseconds = amount * 60 * 1000;
                break;
            case 'h':
                milliseconds = amount * 60 * 60 * 1000;
                break;
            default:
                return reply(`❌ Unsupported time unit. Use s, m, or h`);
        }

        if (milliseconds > 365 * 24 * 60 * 60 * 1000) {
            return reply(`❌ Maximum reminder time is 1 year`);
        }

        // Format human-readable time
        let displayTime;
        if (unit === 's') {
            displayTime = `${amount} second${amount !== 1 ? 's' : ''}`;
        } else if (unit === 'm') {
            displayTime = `${amount} minute${amount !== 1 ? 's' : ''}`;
        } else {
            displayTime = `${amount} hour${amount !== 1 ? 's' : ''}`;
        }

        // Create reminder
        const reminderId = `${sender}-${Date.now()}`;
        
        const timer = setTimeout(async () => {
            try {
                // Try to send with image first
                await malvin.sendMessage(m.chat, { 
                    image: { url: REMINDER_IMAGE },
                    caption: `⏰ REMINDER: ${message}\n\n(Set ${displayTime} ago)`,
                    contextInfo: {
                        mentionedJid: [sender]
                    }
                });
            } catch (e) {
                // Fallback to text if image fails
                await malvin.sendMessage(m.chat, { 
                    text: `⏰ REMINDER: ${message}\n\n(Set ${displayTime} ago)`,
                    contextInfo: {
                        mentionedJid: [sender]
                    }
                });
            } finally {
                activeReminders.delete(reminderId);
            }
        }, milliseconds);

        // Store the timer
        activeReminders.set(reminderId, {
            timer,
            startTime: Date.now(),
            duration: milliseconds,
            message,
            sender,
            chat: m.chat,
            displayTime
        });

        // Send confirmation
        try {
            await malvin.sendMessage(m.chat, {
                image: { url: REMINDER_IMAGE },
                caption: `✅ Reminder set for ${displayTime}:\n"${message}"\n\nI'll notify you when the time is up!`
            });
        } catch (e) {
            await reply(`✅ Reminder set for ${displayTime}:\n"${message}"\n\nI'll notify you when the time is up!`);
        }

    } catch (e) {
        console.error('Reminder error:', e);
        reply(`❌ Failed to set reminder: ${e.message}`);
    }
});

malvin({
    pattern: "myreminders",
    alias: ["listreminders"],
    category: "utility",
    desc: "Shows your active reminders",
    filename: __filename,
}, async (malvin, mek, m, { reply, sender }) => {
    try {
        const userReminders = [];
        
        // Safely iterate through reminders
        activeReminders.forEach((reminder, id) => {
            if (reminder.sender === sender) {
                userReminders.push({ id, reminder });
            }
        });

        if (userReminders.length === 0) {
            return reply("⏳ You don't have any active reminders.");
        }

        let reminderList = "⏰ YOUR ACTIVE REMINDERS:\n\n";
        
        userReminders.forEach(({ id, reminder }, index) => {
            const elapsed = Date.now() - reminder.startTime;
            const remaining = Math.max(0, reminder.duration - elapsed);
            
            // Format remaining time
            let remainingTime;
            if (remaining < 60000) {
                const seconds = Math.ceil(remaining / 1000);
                remainingTime = `${seconds} second${seconds !== 1 ? 's' : ''}`;
            } else if (remaining < 3600000) {
                const minutes = Math.ceil(remaining / 60000);
                remainingTime = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
            } else {
                const hours = Math.ceil(remaining / 3600000);
                remainingTime = `${hours} hour${hours !== 1 ? 's' : ''}`;
            }
            
            reminderList += `${index + 1}. "${reminder.message}"\n⏳ ${remainingTime} remaining (set for ${reminder.displayTime})\n\n`;
        });

        await reply(reminderList);

    } catch (e) {
        console.error('MyReminders error:', e);
        reply(`❌ Failed to fetch reminders: ${e.message}`);
    }
});

malvin({
    pattern: "cancelreminder",
    alias: ["stopreminder", "deletereminder"],
    category: "utility",
    desc: "Cancels an active reminder",
    filename: __filename,
    usage: `${prefix}cancelreminder <number>\n(Use ${prefix}myreminders to see numbers)`,
}, async (malvin, mek, m, { args, reply, sender }) => {
    try {
        if (!args[0]) {
            return reply(`❌ Please provide a reminder number\n(Use ${prefix}myreminders to see your reminders)`);
        }

        const reminderNumber = parseInt(args[0]);
        if (isNaN(reminderNumber)) {
            return reply(`❌ Please enter a valid number\n(Use ${prefix}myreminders to see your reminders)`);
        }

        const userReminders = [];
        activeReminders.forEach((reminder, id) => {
            if (reminder.sender === sender) {
                userReminders.push({ id, reminder });
            }
        });

        if (reminderNumber < 1 || reminderNumber > userReminders.length) {
            return reply(`❌ Invalid reminder number. You have ${userReminders.length} active reminders`);
        }

        const { id, reminder } = userReminders[reminderNumber - 1];
        clearTimeout(reminder.timer);
        activeReminders.delete(id);
        
        await reply(`✅ Reminder canceled:\n"${reminder.message}"\n(Was set for ${reminder.displayTime})`);

    } catch (e) {
        console.error('CancelReminder error:', e);
        reply(`❌ Failed to cancel reminder: ${e.message}`);
    }
});

malvin({
    pattern: "cancelallreminders",
    alias: ["stopallreminders"],
    category: "utility",
    desc: "Cancels all your active reminders",
    filename: __filename,
}, async (malvin, mek, m, { reply, sender }) => {
    try {
        let canceledCount = 0;
        
        // Create a copy of entries to avoid modification during iteration
        const remindersToCancel = [];
        activeReminders.forEach((reminder, id) => {
            if (reminder.sender === sender) {
                remindersToCancel.push({ id, reminder });
            }
        });

        if (remindersToCancel.length === 0) {
            return reply("⏳ You don't have any active reminders to cancel.");
        }

        for (const { id, reminder } of remindersToCancel) {
            clearTimeout(reminder.timer);
            activeReminders.delete(id);
            canceledCount++;
        }
        
        await reply(`✅ Canceled all ${canceledCount} of your active reminders.`);

    } catch (e) {
        console.error('CancelAllReminders error:', e);
        reply(`❌ Failed to cancel reminders: ${e.message}`);
    }
});
