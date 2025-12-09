const { malvin } = require("../malvin");
const fs = require('fs');
const path = require('path');

// Path to store contacts
const contactsPath = path.join(__dirname, 'saved_contacts.json');

// Load existing contacts
let savedContacts = {};
try {
  if (fs.existsSync(contactsPath)) {
    const data = fs.readFileSync(contactsPath, 'utf8');
    savedContacts = JSON.parse(data);
  }
} catch (error) {
  console.error('Error loading contacts:', error);
}

// Function to save contacts to file
function saveContactsToFile() {
  try {
    fs.writeFileSync(contactsPath, JSON.stringify(savedContacts, null, 2));
  } catch (error) {
    console.error('Error saving contacts:', error);
  }
}

malvin({
  pattern: "savecontact",
  alias: ["saveuser", "addcontact"],
  react: '📱',
  desc: "Save user contact with their username",
  category: "utility",
  use: ".savecontact [optional custom name]",
  filename: __filename
}, async (malvin, mek, m, { from, reply, args, sender }) => {
  try {
    // Get user info
    const userId = sender.split('@')[0];
    const user = malvin.contacts[sender] || {};
    const userName = user.name || user.notify || userId;
    
    // Check if custom name is provided
    let contactName = args.length > 0 ? args.join(' ') : userName;
    
    // Save contact
    savedContacts[userId] = {
      name: contactName,
      phone: userId,
      savedAt: new Date().toISOString()
    };
    
    // Save to file
    saveContactsToFile();
    
    // Update bot's contact list
    await malvin.updateContact(sender, { 
      name: contactName,
      organization: "Saved Contact"
    });
    
    // Send confirmation
    await reply(`✅ Contact saved successfully!\n\n📛 Name: ${contactName}\n📞 Number: ${userId}\n\nYou can now find this user in your contacts as "${contactName}"`);
    
  } catch (error) {
    console.error('Error saving contact:', error);
    reply('❌ Failed to save contact. Please try again.');
  }
});

// Additional command to list saved contacts
malvin({
  pattern: "mycontacts",
  alias: ["listcontacts", "contacts"],
  react: '📋',
  desc: "List all saved contacts",
  category: "utility",
  use: ".mycontacts",
  filename: __filename
}, async (malvin, mek, m, { from, reply }) => {
  try {
    const contactCount = Object.keys(savedContacts).length;
    
    if (contactCount === 0) {
      return reply('📭 You have no saved contacts yet. Use .savecontact to save a contact.');
    }
    
    let contactList = `📖 Your Saved Contacts (${contactCount}):\n\n`;
    
    Object.entries(savedContacts).forEach(([phone, contact], index) => {
      contactList += `${index + 1}. 📛 ${contact.name}\n   📞 ${phone}\n   ⏰ ${new Date(contact.savedAt).toLocaleDateString()}\n\n`;
    });
    
    await reply(contactList);
    
  } catch (error) {
    console.error('Error listing contacts:', error);
    reply('❌ Failed to retrieve contacts. Please try again.');
  }
});

// Command to search for a contact
malvin({
  pattern: "findcontact",
  alias: ["searchcontact"],
  react: '🔍',
  desc: "Search for a saved contact",
  category: "utility",
  use: ".findcontact [name or number]",
  filename: __filename
}, async (malvin, mek, m, { from, reply, args }) => {
  try {
    if (args.length === 0) {
      return reply('Please provide a name or number to search for. Example: .findcontact john');
    }
    
    const searchTerm = args.join(' ').toLowerCase();
    const results = [];
    
    // Search through contacts
    Object.entries(savedContacts).forEach(([phone, contact]) => {
      if (contact.name.toLowerCase().includes(searchTerm) || phone.includes(searchTerm)) {
        results.push({ phone, ...contact });
      }
    });
    
    if (results.length === 0) {
      return reply(`🔍 No contacts found matching "${searchTerm}"`);
    }
    
    let resultText = `🔍 Search Results for "${searchTerm}":\n\n`;
    
    results.forEach((contact, index) => {
      resultText += `${index + 1}. 📛 ${contact.name}\n   📞 ${contact.phone}\n   ⏰ ${new Date(contact.savedAt).toLocaleDateString()}\n\n`;
    });
    
    await reply(resultText);
    
  } catch (error) {
    console.error('Error searching contacts:', error);
    reply('❌ Failed to search contacts. Please try again.');
  }
});

// Command to delete a contact
malvin({
  pattern: "deletecontact",
  alias: ["removecontact"],
  react: '🗑️',
  desc: "Delete a saved contact",
  category: "utility",
  use: ".deletecontact [phone number]",
  filename: __filename
}, async (malvin, mek, m, { from, reply, args }) => {
  try {
    if (args.length === 0) {
      return reply('Please provide a phone number to delete. Example: .deletecontact 1234567890');
    }
    
    const phoneToDelete = args[0];
    
    if (!savedContacts[phoneToDelete]) {
      return reply(`❌ No contact found with number: ${phoneToDelete}`);
    }
    
    const deletedName = savedContacts[phoneToDelete].name;
    delete savedContacts[phoneToDelete];
    saveContactsToFile();
    
    await reply(`✅ Contact deleted successfully!\n\n🗑️ Removed: ${deletedName} (${phoneToDelete})`);
    
  } catch (error) {
    console.error('Error deleting contact:', error);
    reply('❌ Failed to delete contact. Please try again.');
  }
});
