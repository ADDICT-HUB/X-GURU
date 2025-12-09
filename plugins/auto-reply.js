const fs = require('fs');
const path = require('path');
const config = require('../settings')
const {malvin , commands} = require('../malvin')

//auto reply 
malvin({
  on: "body"
},    
async (malvin, mek, m, { from, body, isOwner }) => {
    const filePath = path.join(__dirname, '../autos/autoreply.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const text in data) {
        if (body.toLowerCase() === text.toLowerCase()) {
            
            if (config.AUTO_REPLY === 'true') {
                //if (isOwner) return;        
                await m.reply(data[text])
            
            }
        }
    }                
});
