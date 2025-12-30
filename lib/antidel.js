const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti } = require('../data');
const config = require('../settings');

//  timezone settings with 12-hour format
const timeOptions = {
    timeZone: 'Africa/Harare',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
};

const getMessageContent = (mek) => {
    if (mek.message?.conversation) return mek.message.conversation;
    if (mek.message?.extendedTextMessage?.text) return mek.message.extendedTextMessage.text;
    return '';
};

const DeletedText = async (malvin, mek, jid, deleteInfo, isGroup, update) => {
    const messageContent = getMessageContent(mek);
    const alertText = `*ᴅᴇʟᴇᴛᴇᴅ ᴍᴇssᴀɢᴇ ᴀʟᴇʀᴛ*\n${deleteInfo}\n  ᴄᴏɴᴛᴇɴᴛs ━ ${messageContent}`;

    const mentionedJid = [];
    if (isGroup) {
        if (update.key.participant) mentionedJid.push(update.key.participant);
        if (mek.key.participant) mentionedJid.push(mek.key.participant);
    } else {
        if (mek.key.participant) mentionedJid.push(mek.key.participant);
        else if (mek.key.remoteJid) mentionedJid.push(mek.key.remoteJid);
    }

    await malvin.sendMessage(
        jid,
        {
            text: alertText,
            contextInfo: {
                mentionedJid: mentionedJid.length ? mentionedJid : undefined,
            },
        },
        { quoted: mek }
    );
};

const DeletedMedia = async (malvin, mek, jid, deleteInfo, messageType) => {
    if (messageType === 'imageMessage' || messageType === 'videoMessage') {
        // For images/videos - put info in caption
        const antideletedmek = structuredClone(mek.message);
        if (antideletedmek[messageType]) {
            antideletedmek[messageType].caption = `*ᴅᴇʟᴇᴛᴇᴅ ᴍᴇssᴀɢᴇ ᴀʟᴇʀᴛ*\n${deleteInfo}\n*┗──────────────⊷*`;
            antideletedmek[messageType].contextInfo = {
                stanzaId: mek.key.id,
                participant: mek.key.participant || mek.key.remoteJid,
                quotedMessage: mek.message,
            };
        }
        await malvin.relayMessage(jid, antideletedmek, {});
    } else {
        // For other media - send alert separately
        const alertText = `*ᴅᴇʟᴇᴛᴇᴅ ᴍᴇssᴀɢᴇ ᴀʟᴇʀᴛ*\n${deleteInfo}`;
        await malvin.sendMessage(jid, { text: alertText }, { quoted: mek });
        await malvin.relayMessage(jid, mek.message, {});
    }
};

const AntiDelete = async (malvin, updates) => {
    for (const update of updates) {
        if (update.update.message === null) {
            const store = await loadMessage(update.key.id);

            if (store && store.message) {
                const mek = store.message;
                const isGroup = isJidGroup(store.jid);
                const antiDeleteStatus = await getAnti();
                if (!antiDeleteStatus) continue;

                const deleteTime = new Date().toLocaleTimeString('en-GB', timeOptions).toLowerCase();

                let deleteInfo, jid;
                if (isGroup) {
                    try {
                        const groupMetadata = await malvin.groupMetadata(store.jid);
                        const groupName = groupMetadata.subject || 'Unknown Group';
                        const sender = mek.key.participant?.split('@')[0] || 'Unknown';
                        const deleter = update.key.participant?.split('@')[0] || 'Unknown';

                        deleteInfo = `*┏──────────────⊷**\n*┇sᴇɴᴅᴇʀ:* @${sender}\n*┇ɢʀᴏᴜᴘ:* ${groupName}\n*┇DELETE TIME:* ${deleteTime} \n*┇ᴅᴇʟᴇᴛᴇᴅ ʙʏ:* @${deleter}\n*┇ᴀᴄᴛɪᴏɴ:* ᴅᴇʟᴇᴛᴇᴅ ᴀ ᴍᴇssᴀɢᴇ`;
                        jid = config.ANTI_DEL_PATH === "inbox" ? malvin.user.id : store.jid;
                    } catch (e) {
                        console.error('Error getting group metadata:', e);
                        continue;
                    }
                } else {
                    const senderNumber = mek.key.participant?.split('@')[0] || mek.key.remoteJid?.split('@')[0] || 'Unknown';
                    const deleterNumber = update.key.participant?.split('@')[0] || update.key.remoteJid?.split('@')[0] || 'Unknown';
                    
                    deleteInfo = `*┏──────────────⊷*\n*┇sᴇɴᴅᴇʀ:* @${senderNumber}\n*┇ᴅᴇʟᴇᴛᴇᴅ ᴛɪᴍᴇ:* ${deleteTime}\n*┇ᴅᴇʟᴇᴛᴇᴅ ʙʏ:* @${deleterNumber}\n*┇ᴀᴄᴛɪᴏɴ:* ᴅᴇʟᴇᴛᴇᴅ ᴀ ᴍᴇssᴀɢᴇ`;
                    jid = config.ANTI_DEL_PATH === "inbox" ? malvin.user.id : update.key.remoteJid || store.jid;
                }

                const messageType = mek.message ? Object.keys(mek.message)[0] : null;
                
                if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
                    await DeletedText(malvin, mek, jid, deleteInfo, isGroup, update);
                } else if (messageType && [
                    'imageMessage', 
                    'videoMessage', 
                    'stickerMessage', 
                    'documentMessage', 
                    'audioMessage',
                    'voiceMessage'
                ].includes(messageType)) {
                    await DeletedMedia(malvin, mek, jid, deleteInfo, messageType);
                }
            }
        }
    }
};

module.exports = {
    DeletedText,
    DeletedMedia,
    AntiDelete,
};
