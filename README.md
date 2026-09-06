# 🤖 Bot Discord Valencia Reality Project (SA-MP Roleplay)

Selamat datang di repositori **Bot Discord Valencia Reality Project**. Bot ini dirancang khusus untuk menghubungkan server San Andreas Multiplayer (SA-MP) Roleplay dengan server Discord komunitas Anda. Dilengkapi dengan berbagai fitur otomasi manajemen pemain, pemantauan server realtime, sistem tiket bantuan, webhook rotasi ekonomi pasar, hingga verifikasi email.

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Struktur Folder](#-struktur-folder)
- [Prasyarat Sistem](#-prasyarat-sistem)
- [Instalasi & Persiapan](#-instalasi--persiapan)
- [Konfigurasi (`config.json`)](#-konfigurasi-configjson)
- [Penyesuaian Struktur Database (Penting!)](#-penyesuaian-struktur-database-penting)
- [Cara Menjalankan Bot](#-cara-menjalankan-bot)
- [Daftar Slash Command](#-daftar-slash-command)
- [Integrasi Webhook Rotasi Harga](#-integrasi-webhook-rotasi-harga)
- [Kredit & Hak Cipta](#-kredit--hak-cipta)

---

## ✨ Fitur Utama

### 1. 👤 Panel Pengguna (User Panel)
- **Registrasi UCP Terintegrasi**: Pendaftaran akun UCP game langsung dari Discord dengan verifikasi OTP melalui email.
- **Cek Karakter & Statistik Akun**: Menampilkan saldo tunai, bank, status admin, faction, job 1 & 2, hunger/thirst, status VIP, tanggal daftar/login terakhir, serta avatar skin SA-MP.
- **Ganti Password UCP**: Reset kata sandi akun game secara aman via konfirmasi email.
- **Pengajuan Character Story (CS)**: Form modal interaktif untuk pengajuan CS yang langsung diteruskan ke channel review admin.
- **Pengecekan Akun & Reverifikasi**: Cek status UCP dan update tautan akun Discord.

### 2. 🛡️ Panel Admin & Moderasi
- **Manajemen Akun UCP & Karakter**: Mengubah data atau menghapus UCP/karakter pemain secara langsung.
- **Review Character Story**: Tombol Terima (Accept) dan Tolak (Reject dengan input alasan).
- **Manajemen Rank & Hak Akses**: Command `/setadmin`, `/setcs`, `/unsetcs`, `/setvip`, dan `/banned`.
- **Broadcast Pengumuman**: Publikasi FAQ dan update changelog game secara otomatis ke channel khusus.

### 3. 🌐 Integrasi SA-MP & Monitoring Server
- **Server Status Realtime**: Memantau status server SA-MP (Online, Offline, Maintenance) menggunakan query UDP (`samp-query` & `gamedig`).
- **Statistik Otomatis & Leaderboard**: Pembaruan berkala untuk daftar pemain dengan kekayaan tertinggi atau total waktu bermain (playtime).
- **Pelacak Playtime**: Cache dan kalkulasi durasi bermain pemain in-game.

### 4. 🎫 Sistem Tiket Bantuan (Ticket System)
- **Kategori Tiket Fleksibel**:
  - Tiket Laporan Pemain / Pelanggaran (Report Ticket)
  - Tiket Pengajuan Unban (Unban Appeal)
  - Tiket Donasi & VIP (Donation Ticket)
- **Otomasi Channel**: Pembuatan channel private otomatis saat tiket dibuka, tombol penutupan tiket, dan arsip riwayat percakapan.

### 5. 💰 Web Server & Webhook Rotasi Harga Pasar
- **Express.js API Server**: Endpoint HTTP `POST /price-update` (port default `25565`).
- **Notifikasi Perubahan Harga**: Otomatis mengirim embed perubahan harga 19 komoditas ekonomi game (Material, Lumber, Metal, GasOil, Obat, Ikan, Daging, dll.) lengkap dengan indikator:
  - 🔺 **Naik**
  - 🔻 **Turun**
  - ⚪ **Stabil**

### 6. 📌 Sistem Sticky Message
- Menjaga pesan penting/peraturan/info panduan server tetap berada di baris paling bawah channel tanya jawab/diskusi.

### 7. 🎵 Fitur Tambahan
- **Boombox / Audio Player**: Pemutar audio YouTube menggunakan `play-dl` / `ytdl-core` / `yt-dlp`.

---

## 📁 Struktur Folder

```text
├── buttons/               # Handler tombol interaktif Discord
│   ├── panel admin/       # Tombol navigasi aksi admin
│   ├── panel user/        # Tombol aksi pengguna (Register, Cek Karakter, Donasi, dll.)
│   ├── server status/     # Tombol interaksi status server
│   ├── support panel/     # Tombol bantuan
│   └── ticket/            # Tombol kelola tiket (tutup tiket, buat tiket)
├── commands/              # Definisi Slash Commands Discord
│   └── moderation/        # Kumpulan command moderasi dan utilitas
├── dropdown/              # Handler dropdown menu interaktif
│   ├── selectCharacter.js # Dropdown pemilihan karakter & tampilan status
│   └── ...
├── events/                # Discord Client Event Listeners
│   ├── clientReady.js     # Handler saat bot berhasil online
│   ├── interactionCreate.js # Router utama (commands, buttons, modals, dropdowns)
│   └── messageCreate.js   # Handler pesan teks (termasuk sticky trigger)
├── functions/             # Modul logika bisnis & utilitas pendukung
│   ├── connect.js         # Query koneksi game SA-MP
│   ├── database.js        # Pool koneksi MySQL (mysql2/promise)
│   ├── deploy-commands.js # Skrip pendaftaran Slash Commands ke Discord API
│   ├── emailService.js    # Pengiriman email OTP via Nodemailer
│   ├── leaderboard.js     # Pembaruan ranking pemain
│   └── server-status.js   # Monitor status server SA-MP
├── modals/                # Handler formulir input modal popup
│   ├── admin/             # Modal aksi admin (alasan tolak CS, ganti UCP, dll.)
│   └── user/              # Modal aksi pengguna (form register, submit CS, dll.)
├── config.json            # Berkas konfigurasi utama bot
├── main.js                # Entry point utama aplikasi & Express web server
├── sticky.js              # Sistem pesan sticky otomatis
└── package.json           # Dependensi dependensi Node.js
```

---

## 💻 Prasyarat Sistem

Sebelum menjalankan bot, pastikan lingkungan server/komputer Anda telah terpasang:
- **Node.js**: Versi `v18.x` atau `v20.x` (LTS direkomendasikan)
- **Database MySQL**: Database game server SA-MP yang dapat diakses oleh bot
- **Akun Discord Bot**: Token bot dan Application ID dari [Discord Developer Portal](https://discord.com/developers/applications)
- **Akun Gmail / SMTP**: Diperlukan untuk pengiriman email OTP (gunakan *App Password* jika menggunakan Gmail)

---

## 🚀 Instalasi & Persiapan

1. **Clone atau Unduh Repositori**:
   ```bash
   git clone <URL_REPOSITORI_ANDA>
   cd "bot valencia"
   ```

2. **Instal Seluruh Dependensi**:
   Menggunakan NPM:
   ```bash
   npm install
   ```
   Atau menggunakan Yarn:
   ```bash
   yarn install
   ```

---

## ⚙️ Konfigurasi (`config.json`)

Buka berkas `config.json` lalu sesuaikan data dengan kredensial Discord server dan database Anda:

```json
{
  "token": "DISCORD_BOT_TOKEN_ANDA",
  "dccBotId": "",
  "clientId": "DISCORD_APPLICATION_CLIENT_ID",
  "rapidapi_key": "",
  "guildId": "DISCORD_GUILD_SERVER_ID",
  "server": {
    "serverIP": "127.0.0.1",
    "serverPort": "7777",
    "logo": "URL_LOGO_SERVER_ANDA"
  },
  "roles": {
    "adminRole": "ID_ROLE_ADMIN",
    "serversupport": "ID_ROLE_SERVER_SUPPORT",
    "FounderRole": "ID_ROLE_FOUNDER",
    "roleCitizen": "ID_ROLE_WARGA_VERIFIED"
  },
  "ticket": {
    "categoryId": "ID_KATEGORI_TIKET_UMUM",
    "categoryDonate": "ID_KATEGORI_TIKET_DONASI",
    "logChannelId": "ID_CHANNEL_LOG_TIKET"
  },
  "email": {
    "service": "gmail",
    "user": "alamat_email_anda@gmail.com",
    "pass": "APP_PASSWORD_EMAIL_16_DIGIT"
  },
  "channels": {
    "logsaccCs": "ID_CHANNEL_LOG_CS_DITERIMA",
    "adminLogsCS": "ID_CHANNEL_REVIEW_CS_ADMIN",
    "serverstatus": "ID_CHANNEL_STATUS_SERVER",
    "Faqchannel": "ID_CHANNEL_FAQ",
    "serverstats": "ID_CHANNEL_STATISTIK_SERVER",
    "leaderboard": "ID_CHANNEL_LEADERBOARD",
    "updateLogs": "ID_CHANNEL_UPDATE_LOGS"
  },
  "database": {
    "host": "localhost",
    "user": "root",
    "password": "PASSWORD_MYSQL",
    "database": "NAMA_DATABASE_SAMP"
  }
}
```

> **Tips Keamanan**: Jangan pernah membagikan atau mengunggah `config.json` yang berisi Token dan Password Database ke repository publik!

---

## ⚠️ Penyesuaian Struktur Database (Penting!)

Skrip bot ini berinteraksi langsung dengan database SQL server SA-MP Anda. Pastikan nama tabel dan kolom pada skrip bot disesuaikan dengan gamemode Anda:

1. **Tabel Akun & Karakter**:
   - Secara default bot menggunakan query ke tabel `players` atau `users`.
   - Cek file [`dropdown/selectCharacter.js`](dropdown/selectCharacter.js):
     ```javascript
     const [characterData] = await pool.execute(
       "SELECT * FROM players WHERE username = ?",
       [characterName]
     );
     ```
     Jika nama tabel Anda bukan `players` (misalnya `characters` atau `users`), ganti nama tabel tersebut.
2. **Kolom Data Karakter**:
   - Kolom yang dibaca meliputi: `username`, `level`, `gender`, `age`, `admin`, `reg_date`, `last_login`, `money`, `bmoney`, `vip`, `vip_time`, `hunger`, `energy`, `faction`, `job`, `job2`, dan `skin`.
   - Jika ada perbedaan penamaan kolom pada tabel gamemode Anda (misalnya `cash` bukan `money`, atau `bank` bukan `bmoney`), sesuaikan variabel propertinya.
3. **Pesan Sticky**:
   - Atur ID channel dan kata kunci trigger sticky message pada file [`sticky.js`](sticky.js).

---

## ▶️ Cara Menjalankan Bot

### Mode Development
Jalankan bot langsung melalui terminal:
```bash
node main.js
```
Bot akan otomatis:
1. Membuka koneksi Express Web Server di port yang telah ditentukan.
2. Mendaftarkan seluruh Slash Commands ke server Discord (`deploy-commands`).
3. Menginisialisasi modul buttons, modals, dropdowns, dan sticky message.
4. Masuk (Login) ke akun bot Discord.

### Mode Production (Menggunakan PM2)
Disarankan menggunakan process manager seperti **PM2** agar bot tetap berjalan di latar belakang (background) dan otomatis restart jika terjadi crash:
```bash
npm install -g pm2
pm2 start main.js --name "bot-valencia"
pm2 save
pm2 startup
```

Untuk melihat log:
```bash
pm2 logs bot-valencia
```

---

## 💬 Daftar Slash Command

Berikut beberapa slash command utama yang tersedia:

| Perintah | Deskripsi | Hak Akses |
| :--- | :--- | :--- |
| `/paneluser` | Mengirimkan panel menu interaktif untuk pemain (Register, CS, Cek Akun, dll.) | Admin |
| `/paneladmin` | Mengirimkan panel kontrol administrasi database & akun | Admin |
| `/panelcs` | Mengirimkan panel Character Story | Admin |
| `/server-panel` | Mengirimkan panel informasi & status server | Admin |
| `/ticket-setup` | Memasang pesan pembukaan tiket interaktif (Report / Unban) | Admin |
| `/ticket-donate` | Memasang pesan pembukaan tiket donasi | Admin |
| `/setadmin <user> <level>` | Mengatur tingkat jabatan admin player di database | Founder / Admin |
| `/setvip <user> <level> <hari>` | Menambahkan status VIP pada akun player | Founder / Admin |
| `/setcs <karakter>` | Menerima & mengaktifkan status Character Story karakter | Admin / CS Team |
| `/unsetcs <karakter>` | Menolak atau mencabut status Character Story karakter | Admin / CS Team |
| `/banned <aksi>` | Perintah utilitas sanksi ban/unban pemain | Admin |
| `/logsupdate <versi> <log>` | Mengirim format pengumuman changelog pembaruan server | Admin |
| `/playtime [user]` | Memeriksa waktu bermain (playtime) pemain | Semua Pengguna |
| `/boombox <url>` | Memutar musik melalui bot di voice channel | Semua Pengguna |

---

## 📈 Integrasi Webhook Rotasi Harga

Server Express internal menerima webhook dari gamemode SA-MP saat rotasi harga komoditas terjadi:

- **Metode**: `POST`
- **URL**: `http://IP_SERVER_BOT:25565/price-update`
- **Headers**: `Content-Type: application/json`
- **Contoh Body Request**:
  ```json
  {
    "prices": {
      "material": 1500,
      "lumber": 2200,
      "metal": 3100,
      "component": 1200,
      "gasoil": 950,
      "coal": 800,
      "product": 500,
      "medicine": 1400,
      "medkit": 2000,
      "food": 600,
      "seed": 350,
      "potato": 450,
      "wheat": 500,
      "orange": 700,
      "marijuana": 5000,
      "fish": 1100,
      "meat": 1300,
      "gstation": 15000,
      "obat": 2500
    },
    "previousPrices": {
      "material": 1400,
      "lumber": 2400,
      "metal": 3100
    }
  }
  ```
Bot akan memformat angka uang sesuai format mata uang in-game dan menampilkan indikator naik/turun/stabil secara visual di Discord.

---

## Kredit & Catatan

- **Original Author**: **Yellowcrush**
- **Dilarang keras**: Menghapus atau mengubah kredit nama pembuat asli pada sistem!
- **Framework**: [Discord.js v14](https://discord.js.org/)