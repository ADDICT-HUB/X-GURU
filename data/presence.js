const config = require('../settings');

/**
 * Validate WhatsApp JIDs to prevent Baileys crashes
 */
const isValidJid = (jid) => {
    return (
        typeof jid === 'string' &&
        jid.includes('@') &&
        !jid.endsWith('@newsletter') &&
        !jid.endsWith('@broadcast')
    );
};

/**
 * Presence controller (mirrors user presence safely)
 */
const PresenceControl = async (malvin, update) => {
    try {
        if (!update?.id || !isValidJid(update.id)) return;

        // Force always-online mode
        if (config.ALWAYS_ONLINE === "true") {
            await malvin.sendPresenceUpdate("available", update.id);
            return;
        }

        const userPresence =
            update.presences?.[update.id]?.lastKnownPresence;

        if (!userPresence) return;

        let presenceState = 'unavailable';

        switch (userPresence) {
            case 'available':
            case 'online':
                presenceState = 'available';
                break;

            case 'unavailable':
            case 'offline':
                presenceState = 'unavailable';
                break;

            case 'composing':
            case 'recording':
                if (
                    config.AUTO_TYPING === 'true' ||
                    config.AUTO_RECORDING === 'true'
                ) {
                    return;
                }
                presenceState = 'available';
                break;

            default:
                presenceState = 'unavailable';
        }

        await malvin.sendPresenceUpdate(presenceState, update.id);
    } catch (err) {
        console.error('[PresenceControl Error]', err?.message || err);
    }
};

/**
 * Filters bot activity to avoid invalid presence updates
 */
const BotActivityFilter = (malvin) => {
    const originalSendMessage = malvin.sendMessage;
    const originalSendPresenceUpdate = malvin.sendPresenceUpdate;

    /**
     * Override sendMessage
     */
    malvin.sendMessage = async (jid, content, options) => {
        // Send message normally for invalid/system JIDs
        if (!isValidJid(jid)) {
            return originalSendMessage(jid, content, options);
        }

        let result;
        try {
            result = await originalSendMessage(jid, content, options);
        } catch (err) {
            console.error('[SendMessage Error]', err?.message || err);
            return;
        }

        // Reset presence only if auto features are OFF
        if (
            config.AUTO_TYPING !== 'true' &&
            config.AUTO_RECORDING !== 'true'
        ) {
            try {
                await originalSendPresenceUpdate('unavailable', jid);
            } catch (err) {
                console.error('[Presence Reset Error]', err?.message || err);
            }
        }

        return result;
    };

    /**
     * Override sendPresenceUpdate
     */
    malvin.sendPresenceUpdate = async (type, jid) => {
        if (!isValidJid(jid)) return;

        const stack = new Error().stack || '';

        const allowed =
            stack.includes('PresenceControl') ||
            (type === 'composing' && config.AUTO_TYPING === 'true') ||
            (type === 'recording' && config.AUTO_RECORDING === 'true');

        if (!allowed) return;

        try {
            return await originalSendPresenceUpdate(type, jid);
        } catch (err) {
            console.error('[Presence Update Error]', err?.message || err);
        }
    };
};

module.exports = {
    PresenceControl,
    BotActivityFilter
};
