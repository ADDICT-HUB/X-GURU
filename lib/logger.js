const chalk = require("chalk");
const moment = require("moment-timezone");

// Log levels
const LOG_LEVELS = {
  INFO: { color: chalk.cyan, prefix: "ℹ️" },
  WARN: { color: chalk.yellow, prefix: "⚠️" },
  ERROR: { color: chalk.red, prefix: "❌" },
  DEBUG: { color: chalk.gray, prefix: "🐛" },
};

// Centralized logger
const logger = {
  log: (level, message, details = {}) => {
    const { prefix, color } = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    const timestamp = moment().tz("Africa/Harare").format("YYYY-MM-DD HH:mm:ss");
    const formattedMessage = `[${prefix} ${timestamp}] ${message}`;
    
    // Add details if provided
    let detailLines = "";
    if (Object.keys(details).length > 0) {
      detailLines = Object.entries(details)
        .map(([key, value]) => `├── ${key}: ${value}`)
        .join("\n");
      detailLines += `\n└── End`;
    }
    
    console.log(color(formattedMessage + (detailLines ? `\n${detailLines}` : "")));
  },
  
  info: (message, details = {}) => logger.log("INFO", message, details),
  warn: (message, details = {}) => logger.log("WARN", message, details),
  error: (message, details = {}) => logger.log("ERROR", message, details),
  debug: (message, details = {}) => logger.log("DEBUG", message, details),
};

module.exports = logger;