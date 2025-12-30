const { malvin } = require("../malvin");
const axios = require('axios');
const fs = require('fs');
const path = require("path");
const AdmZip = require("adm-zip");
const config = require('../settings');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// Database setup
const dbPath = path.join(__dirname, '../lib/update.db');
const db = new sqlite3.Database(dbPath);

// Promisify db methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Initialize database
(async function() {
  try {
    await dbRun(`CREATE TABLE IF NOT EXISTS updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT UNIQUE,
      update_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      changes TEXT
    )`);
  } catch (e) {
    console.error('Database initialization error:', e);
  }
})();

// Improved version checking
async function getVersionInfo() {
  try {
    // Get local version from package.json or git
    let localVersion = "unknown";
    
    // Try package.json first
    try {
      const pkg = require('../package.json');
      localVersion = pkg.version;
    } catch {}
    
    // Fallback to git
    if (localVersion === "unknown" && fs.existsSync(path.join(__dirname, '../.git'))) {
      try {
        const head = fs.readFileSync(path.join(__dirname, '../.git/HEAD'), 'utf8').trim();
        if (head.startsWith('ref: ')) {
          const ref = head.substring(5);
          if (fs.existsSync(path.join(__dirname, `../.git/${ref}`))) {
            localVersion = fs.readFileSync(path.join(__dirname, `../.git/${ref}`), 'utf8').trim().substring(0, 7);
          }
        } else {
          localVersion = head.substring(0, 7);
        }
      } catch {}
    }
    
    // Fallback to database
    if (localVersion === "unknown") {
      const lastUpdate = await dbGet("SELECT version FROM updates ORDER BY update_date DESC LIMIT 1");
      localVersion = lastUpdate?.version || "unknown";
    }
    
    return localVersion;
  } catch (e) {
    console.error('Version check error:', e);
    return "unknown";
  }
}

malvin({  
  pattern: "update",  
  alias: ["upgrade", "sync"],  
  react: '🚀',  
  desc: "Update the bot to the latest version",  
  category: "system",  
  filename: __filename
}, async (client, message, args, { from, reply, sender, isOwner }) => {  
  if (!isOwner) return reply("❌ Owner only command!");
  
  try {
    const repoUrl = config.REPO || "https://github.com/betingrich4/Mercedes";
    const repoApiUrl = repoUrl.replace('github.com', 'api.github.com/repos');
    
    // Get current local version
    const localVersion = await getVersionInfo();
    await reply(`🔍 Current version: ${localVersion}`);
    
    // Get latest release info
    await reply("Checking for updates...");
    let latestVersion;
    let changes = "Manual update";
    
    try {
      // Try releases first
      const releaseResponse = await axios.get(`${repoApiUrl}/releases/latest`, { timeout: 10000 });
      latestVersion = releaseResponse.data.tag_name;
      changes = releaseResponse.data.body || "No changelog provided";
      
      // If versions match, return immediately
      if (latestVersion === localVersion) {
        return reply(`✅ Already on latest release version: ${localVersion}`);
      }
    } catch (releaseError) {
      console.log('No releases found, checking main branch');
      
      // Fallback to main branch commit
      const commitResponse = await axios.get(`${repoApiUrl}/commits/main`, { timeout: 10000 });
      latestVersion = commitResponse.data.sha.substring(0, 7);
      changes = commitResponse.data.commit.message || "Main branch update";
      
      // If commit hashes match
      if (latestVersion === localVersion) {
        return reply(`✅ Already on latest commit: ${localVersion}`);
      }
    }
    
    // Confirm update
    await reply(`📥 New version available: ${latestVersion}\n\nChanges:\n${changes}\n\nUpdating...`);
    
    // Download the ZIP
    const { data } = await axios.get(`${repoUrl}/archive/main.zip`, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    // Process ZIP
    const zip = new AdmZip(data);
    const zipEntries = zip.getEntries();
    const protectedFiles = ["settings.js", "app.json", "data", "lib/update.db", "package-lock.json"];
    const basePath = `${repoUrl.split('/').pop()}-main/`;
    
    await reply("🔄 Applying updates...");
    
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      const relativePath = entry.entryName.replace(basePath, '');
      const destPath = path.join(__dirname, '..', relativePath);
      
      if (protectedFiles.some(f => destPath.includes(f))) continue;
      
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      zip.extractEntryTo(entry, dir, false, true, entry.name);
    }

    // Record update
    try {
      await dbRun(
        "INSERT OR IGNORE INTO updates (version, changes) VALUES (?, ?)",
        [latestVersion, changes]
      );
    } catch (dbError) {
      console.error('Database update error:', dbError);
    }

    await reply(`✅ Update to ${latestVersion} complete!\n\nRestarting...`);
    setTimeout(() => process.exit(0), 2000);

  } catch (error) {
    console.error("Update error:", error);
    reply(`❌ Update failed: ${error.message}\n\nPlease update manually from:\n${config.REPO || "https://github.com/betingrich4/Mercedes"}`);
  }
});

