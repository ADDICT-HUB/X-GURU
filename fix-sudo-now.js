const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING sudo.json NOW...');

try {
    // Check if lib directory exists
    if (!fs.existsSync('./lib')) {
        fs.mkdirSync('./lib', { recursive: true });
        console.log('📁 Created lib directory');
    }
    
    // Create CORRECT sudo.json with valid JSON
    const freshSudo = ["254762025340@s.whatsapp.net", "218942841878@s.whatsapp.net"];
    
    // Write with proper JSON formatting
    fs.writeFileSync(
        './lib/sudo.json', 
        JSON.stringify(freshSudo, null, 2)
    );
    
    console.log('✅ sudo.json FIXED with owners:');
    console.log('👑', freshSudo[0]);
    console.log('👑', freshSudo[1]);
    console.log('\n✅ File saved: ./lib/sudo.json');
    
    // Verify it can be read
    const verify = fs.readFileSync('./lib/sudo.json', 'utf-8');
    JSON.parse(verify); // This will throw if invalid
    console.log('✅ sudo.json is valid JSON');
    
} catch (error) {
    console.error('❌ Error fixing sudo.json:', error.message);
}
