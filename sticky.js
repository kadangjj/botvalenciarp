// ============================================
// FILE: sticky.js
// ============================================
const { Events } = require('discord.js');

// Variabel untuk menyimpan stickied message
let stickyData = {
  messageId: null,
  cooldown: false,
};

// Konfigurasi stickied message
const STICKY_CONFIG = {
  channelId: '1332506776368582670', // Ganti dengan Channel ID Anda
  cooldownTime: 5000, // Cooldown 5 detik untuk mencegah spam
  keywords: ['ip', 'server', 'ucp'], // Kata kunci yang memicu sticky message
  message: `📌 **Stickied Message**
Halo! Sebelum tanya-tanya, pastiin dulu kalian baca ini ya:
- <#1443947036314566656> — Info & Peraturan Server
- <#1443919005151662191> — Cara Ambil IP Address
- <#1332506776368582670> — Tempat Tanya Admin & Diskusi

Biar nggak bingung, baca dulu baru tanya. Thanks! 🙌`,
};

// Fungsi kirim stickied message
async function sendSticky(channel, triggeredBy) {
  try {
    // Cek cooldown untuk mencegah spam
    if (stickyData.cooldown) {
      return;
    }

    // Hapus pesan sticky lama
    if (stickyData.messageId) {
      const oldMsg = await channel.messages.fetch(stickyData.messageId).catch(() => null);
      if (oldMsg) await oldMsg.delete().catch(() => {});
    }
    
    // Kirim pesan sticky baru
    const newMsg = await channel.send(STICKY_CONFIG.message);
    stickyData.messageId = newMsg.id;
    
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    console.log(`✅ [STICKY] Pesan terkirim pada ${now} | Dipicu oleh: ${triggeredBy}`);

    // Set cooldown
    stickyData.cooldown = true;
    setTimeout(() => {
      stickyData.cooldown = false;
    }, STICKY_CONFIG.cooldownTime);
    
  } catch (err) {
    console.error('❌ [STICKY] Error:', err.message);
  }
}

// Setup sticky message system
function initStickySystem(client) {
  // Event: Bot ready
  client.once(Events.ClientReady, async () => {
    console.log(`✅ [STICKY] System initialized`);
    console.log(`🔑 [STICKY] Keywords aktif: ${STICKY_CONFIG.keywords.join(', ')}`);
    
    const channel = client.channels.cache.get(STICKY_CONFIG.channelId);
    
    if (channel) {
      console.log('✅ [STICKY] Channel ditemukan dan siap!');
    } else {
      console.error('❌ [STICKY] Channel tidak ditemukan! ID:', STICKY_CONFIG.channelId);
    }
  });

  // Event: Ada pesan baru
  client.on(Events.MessageCreate, async (message) => {
    // Skip jika bot
    if (message.author.bot) return;
    
    // Skip jika bukan channel yang ditentukan
    if (message.channel.id !== STICKY_CONFIG.channelId) return;
    
    // Cek jika pesan mengandung salah satu keyword (case insensitive)
    const content = message.content.toLowerCase();
    const triggeredKeyword = STICKY_CONFIG.keywords.find(keyword => 
      content.includes(keyword)
    );
    
    if (triggeredKeyword) {
      console.log(`📬 [STICKY] Keyword "${triggeredKeyword}" dari ${message.author.tag}`);
      await sendSticky(message.channel, message.author.tag);
    }
  });

  // Cleanup saat bot shutdown
  process.on('SIGINT', () => {
    console.log('🛑 [STICKY] Shutting down...');
  });
}

module.exports = { initStickySystem };