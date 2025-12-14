const { malvin } = require('../malvin');
const config = require('../settings');
const fs = require('fs');
const path = require('path');

malvin({
    pattern: "vcf",
    desc: "Export group members as VCF contacts",
    category: "tools",
    filename: __filename,
    groupOnly: true,
    usage: `${config.PREFIX}vcf`
}, async (malvin, mek, m, { reply, isAdmin, isOwner }) => {
    try {
        const groupMetadata = await malvin.groupMetadata(m.chat);
        const participants = groupMetadata.participants || [];

        if (participants.length < 2) {
            return reply("❌ Group must have at least 2 members");
        }

        if (participants.length > 1024) {
            return reply("❌ Group too large (max 1024 members)");
        }

        let vcfContent = '';
        let count = 0;

        participants.forEach(p => {
            const phone = p.id.split('@')[0];

            // Best possible name resolution
            const name =
                p.notify ||
                p.pushName ||
                `User_${phone}`;

            const role =
                p.id === groupMetadata.owner ? 'Owner' :
                p.admin ? 'Admin' :
                'Member';

            vcfContent +=
`BEGIN:VCARD
VERSION:3.0
FN:${name}
N:${name};;;;
TEL;TYPE=CELL:+${phone}
NOTE:Group: ${groupMetadata.subject} | Role: ${role}
END:VCARD

`;
            count++;
        });

        const safeGroupName = groupMetadata.subject.replace(/[^\w]/g, '_');
        const tempDir = path.join(__dirname, '../temp');

        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const fileName = `${safeGroupName}_${count}_contacts.vcf`;
        const filePath = path.join(tempDir, fileName);

        fs.writeFileSync(filePath, vcfContent);

        await malvin.sendMessage(m.chat, {
            document: fs.readFileSync(filePath),
            mimetype: 'text/vcard',
            fileName,
            caption:
`📇 *Group Contacts Export*

👥 Group: ${groupMetadata.subject}
📦 Total Contacts: ${count}
🕒 Generated: ${new Date().toLocaleString()}

⚠️ Names are based on WhatsApp profile / saved names`
        }, { quoted: m });

        fs.unlinkSync(filePath);

    } catch (err) {
        console.error('VCF Error:', err);
        reply("❌ Failed to export contacts");
    }
});
