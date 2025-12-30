// lib/utils.js
module.exports = {
    getRandomString: function(length = 10) {
        return Math.random().toString(36).substring(2, length + 2);
    },

    getExtensionFromMime: function(mimeType) {
        const extensions = { /* same as above */ };
        return extensions[mimeType] || 'bin';
    },

    formatDuration: function(seconds) { /* same as above */ },

    isValidDuration: function(duration, maxDuration) {
        return duration <= maxDuration;
    }
};
