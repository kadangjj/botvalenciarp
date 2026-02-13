// ============================================
// FILE: commands/moderation/urlbb.js
// ============================================
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

// Load config
const config = require("../../config.json");
const RAPIDAPI_KEY = config.rapidapi_key;
if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY missing in config.json");

const TEMP_DIR = path.join(__dirname, "../../temp");
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

module.exports = {
  data: new SlashCommandBuilder()
    .setName("urlbb")
    .setDescription("Auto convert YouTube/Spotify/TikTok to audio URL for SAMP Boombox")
    .addStringOption((option) =>
      option.setName("url").setDescription("YouTube/Spotify/TikTok URL").setRequired(true)
    ),

  async execute(interaction) {
    const inputUrl = interaction.options.getString("url");

    // Detect platform
    let platform = null;
    if (inputUrl.includes("youtube.com") || inputUrl.includes("youtu.be")) {
      platform = "youtube";
    } else if (inputUrl.includes("spotify.com")) {
      platform = "spotify";
    } else if (inputUrl.includes("tiktok.com")) {
      platform = "tiktok";
    } else {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription("URL tidak valid. Gunakan YouTube, Spotify, atau TikTok URL.")
        ], ephemeral: true
      });
    }

    await interaction.deferReply();
    const timestamp = Date.now();
    const tempFile = path.join(TEMP_DIR, `audio_${timestamp}.mp3`);

    try {
      let downloadUrl, title, thumbnail, sourceUrl;

      // Step 1: Get download link based on platform
      const embed1 = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle(`Step 1/3: Getting ${platform.toUpperCase()} download link...`)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed1] });

      if (platform === "youtube") {
        const result = await getYouTubeAudio(inputUrl, RAPIDAPI_KEY);
        downloadUrl = result.downloadUrl;
        title = result.title;
        thumbnail = result.thumbnail;
        sourceUrl = result.sourceUrl;
      } else if (platform === "spotify") {
        const result = await getSpotifyAudio(inputUrl, RAPIDAPI_KEY);
        downloadUrl = result.downloadUrl;
        title = result.title;
        thumbnail = result.thumbnail;
        sourceUrl = result.sourceUrl;
      } else if (platform === "tiktok") {
        const result = await getTikTokAudio(inputUrl, RAPIDAPI_KEY);
        downloadUrl = result.downloadUrl;
        title = result.title;
        thumbnail = result.thumbnail;
        sourceUrl = result.sourceUrl;
      }

      console.log(`[URLBB] ${platform} Download URL:`, downloadUrl);
      console.log(`[URLBB] ${platform} Title:`, title);

      // Step 2: Download audio file
      const embed2 = new EmbedBuilder()
        .setColor("#FFA500")
        .setTitle("Step 2/3: Downloading audio...")
        .setDescription(`**Title:** ${title}`)
        .setTimestamp();
      await interaction.editReply({ embeds: [embed2] });

      await downloadFile(downloadUrl, tempFile);

      // Verify file
      if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size === 0) {
        throw new Error("File audio kosong atau gagal didownload");
      }

      const fileSize = fs.statSync(tempFile).size;
      console.log("[URLBB] Audio file size:", fileSize, "bytes");

      // Step 3: Upload to file host
      const embed3 = new EmbedBuilder()
        .setColor("#FFA500")
        .setTitle("Step 3/3: Uploading audio...")
        .setDescription("Uploading to file hosting service...")
        .setTimestamp();
      await interaction.editReply({ embeds: [embed3] });

      let uploadUrl = await uploadFallback(tempFile);
      if (!uploadUrl) throw new Error("Upload gagal ke semua service");

      const embedSuccess = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("SAMP Boombox URL Ready!")
        .setDescription(`Audio berhasil diupload dari ${platform.toUpperCase()}!`)
        .addFields(
          { name: "Title", value: title.substring(0, 256), inline: false },
          { name: "Source", value: `[Open ${platform.toUpperCase()}](${sourceUrl})`, inline: false },
          { name: "File Size", value: `${(fileSize / 1024 / 1024).toFixed(2)} MB`, inline: true },
          {
            name: "Audio URL",
            value: uploadUrl.length > 1000 ? "Check message below" : `${uploadUrl}`,
            inline: false,
          },
          { name: "How to Use in SAMP", value: "```/setbb > custom url [paste URL above]```", inline: false }
        )
        .setThumbnail(thumbnail)
        .setFooter({ text: "Valencia Roleplay • Fully Automated" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embedSuccess] });
      //await interaction.followUp({ content: `**Audio URL for SAMP:**\n${uploadUrl}` });

      // Cleanup
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch (err) {
      console.error("[URLBB Error]", err);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

      let errorMsg = err.message;
      if (err.response?.status === 404) {
        errorMsg = "Content tidak ditemukan atau tidak dapat diakses.";
      } else if (err.response?.status === 429) {
        errorMsg = "Rate limit exceeded. Coba lagi dalam beberapa menit.";
      } else if (err.response?.status === 403) {
        errorMsg = "API key tidak valid.";
      } else if (err.response?.status === 400) {
        errorMsg = "URL tidak valid atau content tidak didukung.";
      }

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Gagal Mendapatkan Audio URL")
            .setDescription(`Terjadi kesalahan: ${errorMsg}\n\n**Kemungkinan penyebab:**\n- Content age-restricted, private, atau region-locked\n- API quota habis\n- Format tidak didukung`),
        ],
      });
    }
  },
};

// ----------------------
// Platform-specific Functions
// ----------------------

async function getYouTubeAudio(url, apiKey) {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error("Tidak dapat mengekstrak Video ID dari URL");
    }

    console.log("[URLBB] Video ID:", videoId);

    const response = await axios.get(
      "https://yt-search-and-download-mp3.p.rapidapi.com/mp3",
      {
        params: { url: url },
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "yt-search-and-download-mp3.p.rapidapi.com",
        },
        timeout: 120000,
      }
    );

    console.log("[URLBB] YouTube API Response:", JSON.stringify(response.data));

    if (!response.data) {
      throw new Error("Tidak ada response dari API");
    }

    const data = response.data;
    const downloadUrl = data.download || data.downloadUrl || data.url || data.link;
    const title = data.title || data.name || videoId;
    const thumbnail = data.thumbnail || data.thumb || null;

    if (!downloadUrl) {
      throw new Error("Download URL tidak ditemukan");
    }

    return {
      downloadUrl,
      title,
      thumbnail,
      sourceUrl: `https://youtube.com/watch?v=${videoId}`
    };
  } catch (err) {
    console.error("[URLBB] YouTube error:", err.message);
    throw new Error("Gagal mendapatkan audio dari YouTube: " + err.message);
  }
}

async function getSpotifyAudio(url, apiKey) {
  try {
    const response = await axios.get(
      "https://spotify-downloader9.p.rapidapi.com/downloadSong",
      {
        params: { songId: url },
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "spotify-downloader9.p.rapidapi.com",
        },
        timeout: 120000,
      }
    );

    console.log("[URLBB] Spotify API Response:", JSON.stringify(response.data));

    const data = response.data;
    const downloadUrl = data.data?.downloadLink || data.downloadLink || data.url || data.link;
    const title = data.data?.title || data.title || data.data?.name || "Spotify Track";
    const thumbnail = data.data?.image || data.image || data.thumbnail || data.data?.cover || null;

    if (!downloadUrl) {
      throw new Error("Download URL tidak ditemukan dari Spotify");
    }

    return {
      downloadUrl,
      title,
      thumbnail,
      sourceUrl: url
    };
  } catch (err) {
    console.error("[URLBB] Spotify error:", err.message);
    throw new Error("Gagal mendapatkan audio dari Spotify: " + err.message);
  }
}

async function getTikTokAudio(url, apiKey) {
  try {
    const response = await axios.get(
      "https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/rich_response/index",
      {
        params: { url: url },
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": "tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com",
        },
        timeout: 120000,
      }
    );

    console.log("[URLBB] TikTok API Response:", JSON.stringify(response.data));

    const data = response.data;

    // TikTok API mengembalikan array, ambil element pertama
    let downloadUrl = data.music;
    let title = data.description || "TikTok Audio";
    let thumbnail = data.cover;

    // Pastikan kita ekstrak string dari array
    if (Array.isArray(downloadUrl)) downloadUrl = downloadUrl[0];
    if (Array.isArray(title)) title = title[0];
    if (Array.isArray(thumbnail)) thumbnail = thumbnail[0];

    // Fallback jika title kosong
    if (!title || title === "") {
      title = `TikTok Audio by ${Array.isArray(data.author) ? data.author[0] : data.author || "Unknown"}`;
    }

    if (!downloadUrl) {
      throw new Error("Download URL tidak ditemukan dari TikTok");
    }

    return {
      downloadUrl,
      title,
      thumbnail,
      sourceUrl: url
    };
  } catch (err) {
    console.error("[URLBB] TikTok error:", err.message);
    throw new Error("Gagal mendapatkan audio dari TikTok: " + err.message);
  }
}

// ----------------------
// Helper Functions
// ----------------------

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

async function downloadFile(url, outputPath) {
  try {
    console.log("[URLBB] Downloading from:", url);

    const response = await axios.get(url, {
      responseType: "stream",
      timeout: 180000, // 3 minutes
      maxRedirects: 5,
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        console.log("[URLBB] File downloaded successfully");
        resolve(outputPath);
      });
      writer.on("error", (err) => {
        console.error("[URLBB] Download write error:", err);
        reject(err);
      });
    });
  } catch (err) {
    console.error("[URLBB] Download file error:", err.message);
    throw new Error("Gagal download file: " + err.message);
  }
}

async function uploadFallback(filePath) {
  console.log("[URLBB] Trying file uploaders...");

  const uploaders = [
    // Top4Top - Primary uploader
    async () => {
      try {
        console.log("[URLBB] Trying Top4Top...");
        const form = new FormData();
        form.append("file_1_", fs.createReadStream(filePath));
        form.append("submitr", "[ رفع الملفات ]");

        const res = await axios.post("https://top4top.io/index.php", form, {
          headers: {
            ...form.getHeaders(),
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          timeout: 180000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        console.log("[URLBB] Top4Top response length:", res.data.length);

        // Extract URL dari HTML response
        const urlMatch = res.data.match(/https?:\/\/[a-z0-9]+\.top4top\.io\/[^\s"'<>]+/i);
        if (urlMatch && urlMatch[0]) {
          const url = urlMatch[0];
          console.log("[URLBB] Top4Top success:", url);
          return url;
        }

        // Alternatif pattern
        const altMatch = res.data.match(/https?:\/\/top4top\.io\/downloadf-[^\s"'<>]+/i);
        if (altMatch && altMatch[0]) {
          console.log("[URLBB] Top4Top success (alt):", altMatch[0]);
          return altMatch[0];
        }

        console.log("[URLBB] Top4Top: No URL found in response");
      } catch (err) {
        console.error("[URLBB] Top4Top failed:", err.message);
      }
      return null;
    },

    // Catbox.moe - Backup
    async () => {
      try {
        console.log("[URLBB] Trying Catbox...");
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", fs.createReadStream(filePath));
        const res = await axios.post("https://catbox.moe/user/api.php", form, {
          headers: { ...form.getHeaders() },
          timeout: 180000,
          maxBodyLength: Infinity,
        });
        if (res.data && typeof res.data === "string" && res.data.includes("https://")) {
          console.log("[URLBB] Catbox success:", res.data.trim());
          return res.data.trim();
        }
      } catch (err) {
        console.error("[URLBB] Catbox failed:", err.message);
      }
      return null;
    },

    // File.io - Backup 2
    async () => {
      try {
        console.log("[URLBB] Trying File.io...");
        const form = new FormData();
        form.append("file", fs.createReadStream(filePath));
        const res = await axios.post("https://file.io", form, {
          headers: { ...form.getHeaders() },
          timeout: 180000,
          maxBodyLength: Infinity,
        });
        if (res.data?.success && res.data?.link) {
          console.log("[URLBB] File.io success:", res.data.link);
          return res.data.link;
        }
      } catch (err) {
        console.error("[URLBB] File.io failed:", err.message);
      }
      return null;
    },

    // Uguu.se - Backup 3
    async () => {
      try {
        console.log("[URLBB] Trying Uguu.se...");
        const form = new FormData();
        form.append("files[]", fs.createReadStream(filePath));
        const res = await axios.post("https://uguu.se/upload", form, {
          headers: { ...form.getHeaders() },
          timeout: 180000,
          maxBodyLength: Infinity,
        });
        if (res.data?.success && res.data?.files?.[0]?.url) {
          console.log("[URLBB] Uguu.se success:", res.data.files[0].url);
          return res.data.files[0].url;
        }
      } catch (err) {
        console.error("[URLBB] Uguu.se failed:", err.message);
      }
      return null;
    },
  ];

  for (const uploader of uploaders) {
    const url = await uploader();
    if (url) return url;
  }

  console.error("[URLBB] All uploaders failed");
  return null;
}