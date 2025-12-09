const axios = require('axios');
const config = require('../settings');
const { malvin, commands } = require('../malvin');

// Ensure API key is stored securely in config
const API_KEY = config.WEATHER_API_KEY || '2d61a72574c11c4f36173b627f8cb177';

malvin({
    pattern: "weather",
    desc: "🌤 Get weather information for a location",
    react: "🌤",
    category: "utility",
    filename: __filename
}, async (malvin, mek, m, { from, q, reply }) => {
    try {
        // Input validation
        if (!q || q.trim().length === 0) {
            return reply("❗ Please provide a city name. Usage: .weather [city name]");
        }

        // Sanitize input to prevent injection
        const city = encodeURIComponent(q.trim());
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

        // Make API request with timeout
        const response = await axios.get(url, {
            timeout: 5000 // 5 second timeout
        });

        const data = response.data;

        // Format weather response
        const weather = `
🌍 *Weather in ${data.name}, ${data.sys.country}* 🌍
🌡️ Temperature: ${data.main.temp}°C
😓 Feels Like: ${data.main.feels_like}°C
▼ Min Temp: ${data.main.temp_min}°C
▲ Max Temp: ${data.main.temp_max}°C
💧 Humidity: ${data.main.humidity}%
☁️ Condition: ${data.weather[0].main}
📝 Description: ${data.weather[0].description}
💨 Wind Speed: ${data.wind.speed} m/s
🔽 Pressure: ${data.main.pressure} hPa
🌅 Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}
🌄 Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}

> *ᴍᴀᴅᴇ ʙʏ ᴍᴀʀɪsᴇʟ*
`;

        return reply(weather);

    } catch (error) {
        console.error('Weather API Error:', error.message);
        
        // Specific error handling
        if (error.response) {
            switch (error.response.status) {
                case 404:
                    return reply("🚫 City not found. Please check the spelling and try again.");
                case 401:
                    return reply("⚠️ Invalid API key. Please contact the bot administrator.");
                case 429:
                    return reply("⚠️ API rate limit exceeded. Please try again later.");
            }
        }
        
        // Handle network errors
        if (error.code === 'ECONNABORTED') {
            return reply("⚠️ Request timed out. Please try again later.");
        }

        // Generic error
        return reply("⚠️ An error occurred while fetching weather data. Please try again later.");
    }
});
