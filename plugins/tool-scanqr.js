const { malvin } = require('../malvin');
const fs = require('fs');
const path = require('path');
const os = require('os');
const Jimp = require('jimp');
const qrCode = require('qrcode-reader');
const FormData = require('form-data');
const axios = require('axios');

// ==================== QR CODE READER ====================
malvin({
    pattern: "qrread",
    desc: "Read QR codes from images",
    alias: ["scanqr", "readqr","scanqrcode"],
    category: "tools",
    react: "🔍",
    filename: __filename
}, async (malvin, mek, m, { from, reply, quoted }) => {
    try {
        const quotedMsg = m.quoted ? m.quoted : m;
        const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';
        
        if (!mimeType.startsWith('image')) {
            return reply('❌ Please reply to an image (JPEG/PNG) containing a QR code');
        }

        // Download and process image
        const buffer = await quotedMsg.download();
        const tempPath = path.join(os.tmpdir(), `qr_${Date.now()}.jpg`);
        fs.writeFileSync(tempPath, buffer);

        try {
            const image = await Jimp.read(tempPath);
            const qr = new qrCode();
            
            const decodedText = await new Promise((resolve) => {
                qr.callback = (err, value) => {
                    if (err) {
                        console.error('QR Decode Error:', err);
                        resolve(null);
                    } else {
                        resolve(value?.result);
                    }
                };
                qr.decode(image.bitmap);
            });

            if (!decodedText) {
                return reply('❌ No QR code found. Please send a clearer image.');
            }

            let response = `✅ *QR Code Content:*\n\n${decodedText}`;
            if (decodedText.match(/^https?:\/\//i)) {
                response += `\n\n⚠️ *Warning:* Be careful visiting unknown URLs`;
            }

            await reply(response);

        } finally {
            fs.unlinkSync(tempPath);
        }

    } catch (error) {
        console.error('QR Read Error:', error);
        reply('❌ Failed to read QR code. Error: ' + (error.message || error));
    }
});

// ==================== VOICE FX PLUGIN ====================

