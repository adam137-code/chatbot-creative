// ======= DEPENDENCIES =======
require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Client: NotionClient } = require('@notionhq/client');
const axios = require('axios');
const express = require('express');
const qrcode = require('qrcode');

// ======== CONFIGURATION ========
const NOTION_API_KEY = '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';
const DATABASE_ID = '1d9364bdbba880d39157cad14e4b939c';
const PARENT_PAGE_ID = '1d9364bdbba880d18bb0c8b037c1e718';
const OLLAMA_MODEL = 'gemma:2b';

// ======== INIT CLIENTS ========
const notion = new NotionClient({ auth: NOTION_API_KEY });

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './wwebjs_auth',
    clientId: "client-1"
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    timeout: 60000
  },
  qrTimeoutMs: 60000,
  restartOnAuthFail: true
});

// ======== GLOBAL VARIABLES ========
let NOTION_USERS_CACHE = [];
let latestQR = '';
let isClientReady = false;

// ======== EXPRESS SERVER FOR QR ========
const app = express();
let latestQR = '';

// Mendapatkan QR code dari WhatsApp
client.on('qr', async qr => {
  console.log('📷 QR code received! Visit /qr to scan.');
  latestQR = qr;
});

// Endpoint untuk QR code
app.get('/qr', async (req, res) => {
  if (!latestQR) return res.send('No QR code yet.');
  const qrImage = await qrcode.toDataURL(latestQR);
  res.send(`
    <html>
      <body style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;">
        <h2>Scan this QR code with WhatsApp</h2>
        <img src="${qrImage}" />
      </body>
    </html>
  `);
});

// Menjalankan server Express di port 3000
app.listen(3000, () => {
  console.log('🔗 Visit https://<your-railway-domain>.railway.app/qr to scan the QR code');
});


client.on('qr', async (qr) => {
  console.log('📷 QR code received! Visit /qr to scan.');
  latestQR = qr;
  isClientReady = false;
});

client.on('authenticated', () => {
  console.log('🔑 Authentication successful!');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failure:', msg);
  isClientReady = false;
});

client.on('ready', () => {
  isClientReady = true;
  console.log('🤖 Bot ready!');
  console.log('📱 Connected as:', client.info.wid.user);
  refreshUserCache();
  setInterval(refreshUserCache, 3600000); // Refresh every hour
});

client.on('disconnected', (reason) => {
  isClientReady = false;
  console.log('❌ Client disconnected:', reason);
});

// ======== IMPROVED HELPER FUNCTIONS ========
async function refreshUserCache() {
  try {
    console.log('🔄 Refreshing Notion user cache...');
    const response = await notion.users.list({});
    NOTION_USERS_CACHE = response.results;
    console.log('✅ User cache updated. Total users:', NOTION_USERS_CACHE.length);
  } catch (err) {
    console.error('❌ Failed to refresh user cache:', err);
  }
}

// ... [Fungsi-fungsi helper lainnya tetap sama, tapi tambahkan logging]
// Contoh di handleAddTask:
async function handleAddTask(content, message) {
  try {
    console.log('📥 Received add task request from:', message.from);
    
    // [Kode ekstraksi data tetap sama]
    
    console.log('Extracted task data:', taskData);
    
    // [Validasi data tetap sama]
    
    const requesterUser = await findUserByNameOrEmail(taskData.requester);
    if (!requesterUser) {
      console.error('User not found:', taskData.requester);
      return await message.reply(`❌ User "${taskData.requester}" tidak ditemukan di Notion`);
    }

    // [Proses pembuatan task di Notion tetap sama]
    
    console.log('✅ Task successfully created in Notion');
    await message.reply(`✅ Request "${taskData.title}" berhasil ditambahkan ke ${taskData.week}!`);
  } catch (err) {
    console.error('Error adding task:', err);
    await message.reply(`❌ Gagal menambahkan request: ${err.message}`);
  }
}

// ======== IMPROVED MESSAGE HANDLER ========
client.on('message', async (message) => {
  try {
    // Skip if client isn't ready
    if (!isClientReady) {
      console.log('⚠️ Ignoring message, client not ready');
      return;
    }

    console.log('\n📩 New message from:', message.from, 'Content:', message.body);

    let content = message.body;
    const isGroupChat = message.from.endsWith('@g.us');

    // Handle group mentions
    if (isGroupChat) {
      const botNumber = `${client.info.wid.user}@c.us`;
      if (!message.mentionedIds?.includes(botNumber)) {
        console.log('⚠️ Ignoring group message without mention');
        return;
      }
      content = content.replace(/@\d+/g, '').trim();
      console.log('Group message after mention removal:', content);
    }

    // Command routing with better logging
    if (/^prompt add request/i.test(content)) {
      console.log('Handling prompt add request');
      await handlePromptAddRequest(message);
    }
    else if (/^list all\s*\//i.test(content)) {
      console.log('Handling list all request');
      await handleListAllTasks(content, message);
    }
    // ... [Rute command lainnya tetap sama]

    else {
      console.log('No command matched');
    }
  } catch (err) {
    console.error('❌ Error in message handler:', err);
    try {
      await message.reply('❌ Terjadi kesalahan saat memproses perintah');
    } catch (replyErr) {
      console.error('❌ Failed to send error reply:', replyErr);
    }
  }
});

// ======== START BOT WITH IMPROVED LOGGING ========
console.log('⏳ Starting bot...');
client.initialize().catch(err => {
  console.error('❌ Failed to initialize client:', err);
  process.exit(1);
});

// ... [Fungsi-fungsi lainnya tetap sama]
