const config = require('../settings');
const { makeWASocket } = require(config.BAILEYS); // Example using Baileys

const malvin = makeWASocket({
    // Connection configuration
});

module.exports = malvin;
