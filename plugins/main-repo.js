const fetch = require('node-fetch');
const config = require('../settings');
const { malvin } = require('../malvin');

malvin({
    pattern: "repo",
    alias: ["sc", "script", "info"],
    desc: "Show X-GURU GitHub repository information",
    react: "✨",
    category: "info",
    filename: __filename,
},
async (conn, mek, m, { from, reply }) => {

    const githubRepoURL = "https://github.com/ADDICT-HUB/X-GURU";
    const imageURL = "https://i.ibb.co/83NQTRL/xguru-1765723475694.jpg";

    try {
        const match = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) return reply("❌ Invalid GitHub repository URL.");

        const [, username, repoName] = match;

        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`);
        if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);

        const repoData = await response.json();

        const botName = "X-GURU";
        const ownerName = "GuruTech";

        const stars = repoData.stargazers_count;
        const forks = repoData.forks_count;
        const repoLink = repoData.html_url;

        const releaseDate = new Date(repoData.created_at).toLocaleDateString();
        const lastUpdate = new Date(repoData.updated_at).toLocaleDateString();

        const caption = `
*👋 HELLO, THIS IS ${botName}*

🚀 *Official GitHub Repository*
━━━━━━━━━━━━━━━
⭐ *Stars:* ${stars}
🍴 *Forks:* ${forks}
📅 *Release Date:* ${releaseDate}
♻️ *Last Update:* ${lastUpdate}
👤 *Owner:* ${ownerName}
🔗 *Repository:* ${repoLink}
━━━━━━━━━━━━━━━
✨ _Powered by ${ownerName}_
`;

        // Fetch image
        const imgRes = await fetch(imageURL);
        if (!imgRes.ok) throw new Error("Failed to load image");
        const imageBuffer = await imgRes.buffer();

        await conn.sendMessage(from, {
            image: imageBuffer,
            caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "120363421164015033@newsletter",
                    newsletterName: "X-GURU Updates",
                    serverMessageId: 1
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error("❌ Repo Command Error:", err);
        reply("❌ Failed to fetch repository details. Try again later.");
    }
});
