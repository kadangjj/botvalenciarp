// ============================================
// FILE: commands/moderation/urlbb.js (FULLY AUTOMATED)
// ============================================
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const ytdl = require("@distube/ytdl-core");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { exec } = require("child_process");
const { promisify } = require("util");

const execPromise = promisify(exec);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("urlbb")
    .setDescription("Auto convert YouTube to audio URL for SAMP Boombox")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("YouTube video URL")
        .setRequired(true)
    ),
  async execute(interaction) {
    const videoUrl = interaction.options.getString("url");

    if (!videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be")) {
      return interaction.reply({
        content: "❌ URL YouTube tidak valid.",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const tempDir = path.join(__dirname, "../../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    let filePath = null;

    try {
      // Step 1: Validate & Get Info
      const embed1 = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("⏳ Step 1/4: Getting video info...")
        .setTimestamp();

      await interaction.editReply({ embeds: [embed1] });

      if (!ytdl.validateURL(videoUrl)) {
        return interaction.editReply({
          content: "❌ URL YouTube tidak valid!",
        });
      }

      const info = await ytdl.getInfo(videoUrl);
      const title = info.videoDetails.title;
      const author = info.videoDetails.author.name;
      const duration = parseInt(info.videoDetails.lengthSeconds);
      const thumbnail = info.videoDetails.thumbnails[0].url;
      const videoId = info.videoDetails.videoId;

      // Check duration (max 10 minutes)
      if (duration > 600) {
        return interaction.editReply({
          content: "❌ Video terlalu panjang! Maksimal 10 menit.",
        });
      }

      // Step 2: Download Audio
      const embed2 = new EmbedBuilder()
        .setColor("#FFA500")
        .setTitle("⏳ Step 2/4: Downloading audio...")
        .setDescription(`**Title:** ${title}`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed2] });

      filePath = path.join(tempDir, `audio_${timestamp}.webm`);

      // Download with ytdl-core
      const audioStream = ytdl(videoUrl, {
        quality: "highestaudio",
        filter: "audioonly",
      });

      const writeStream = fs.createWriteStream(filePath);
      audioStream.pipe(writeStream);

      await new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
        audioStream.on("error", reject);

        // Timeout 2 minutes
        setTimeout(() => {
          writeStream.destroy();
          reject(new Error("Download timeout"));
        }, 120000);
      });

      // Verify file
      if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1000) {
        throw new Error("Download failed or file corrupted");
      }

      // Step 3: Convert to MP3 (if ffmpeg available)
      const embed3 = new EmbedBuilder()
        .setColor("#FFA500")
        .setTitle("⏳ Step 3/4: Processing audio...")
        .setTimestamp();

      await interaction.editReply({ embeds: [embed3] });

      // Try convert to MP3 with ffmpeg
      const mp3Path = path.join(tempDir, `audio_${timestamp}.mp3`);
      let finalPath = filePath;

      try {
        // Check if ffmpeg exists
        await execPromise("ffmpeg -version");

        // Convert to MP3
        await execPromise(
          `ffmpeg -i "${filePath}" -vn -ar 44100 -ac 2 -b:a 128k "${mp3Path}"`
        );

        // Use MP3 if conversion successful
        if (fs.existsSync(mp3Path) && fs.statSync(mp3Path).size > 1000) {
          fs.unlinkSync(filePath); // Delete webm
          finalPath = mp3Path;
        }
      } catch (ffmpegError) {
        console.log("FFmpeg not available, using webm");
      }

      // Check file size
      const stats = fs.statSync(finalPath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > 100) {
        fs.unlinkSync(finalPath);
        return interaction.editReply({
          content: "❌ File terlalu besar! Maksimal 100MB.",
        });
      }

      // Step 4: Upload to multiple services
      const embed4 = new EmbedBuilder()
        .setColor("#FFA500")
        .setTitle("⏳ Step 4/4: Uploading...")
        .setDescription(`**File size:** ${fileSizeMB.toFixed(2)} MB`)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed4] });

      const uploadUrl = await uploadFile(finalPath);

      // Cleanup
      fs.unlinkSync(finalPath);

      if (!uploadUrl) {
        return interaction.editReply({
          content:
            "❌ Upload gagal ke semua service! Coba lagi atau gunakan `/radio`",
        });
      }

      // Success!
      const embed5 = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("✅ SAMP Boombox URL Ready!")
        .setDescription("Audio berhasil diupload!")
        .addFields(
          {
            name: "🎬 Video Title",
            value: title.substring(0, 256),
            inline: false,
          },
          {
            name: "👤 Channel",
            value: author.substring(0, 256),
            inline: true,
          },
          {
            name: "⏱️ Duration",
            value: `${Math.floor(duration / 60)}:${(duration % 60)
              .toString()
              .padStart(2, "0")}`,
            inline: true,
          },
          {
            name: "📊 File Size",
            value: `${fileSizeMB.toFixed(2)} MB`,
            inline: true,
          },
          {
            name: "📺 YouTube Source",
            value: `[Open Video](${videoUrl})`,
            inline: false,
          },
          {
            name: "🔗 Audio URL",
            value:
              uploadUrl.length > 1000
                ? "Check message below"
                : `\`\`\`${uploadUrl}\`\`\``,
            inline: false,
          },
          {
            name: "📝 How to Use in SAMP",
            value: "```/boombox [paste URL above]```",
            inline: false,
          }
        )
        .setThumbnail(thumbnail)
        .setFooter({
          text: "Valencia Roleplay • Fully Automated",
          iconURL: interaction.guild.iconURL(),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed5] });

      await interaction.followUp({
        content: `**🔗 Audio URL for SAMP:**\n${uploadUrl}`,
        ephemeral: false,
      });
    } catch (error) {
      console.error("[URLBB Error]", error);

      // Cleanup on error
      try {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        // Clean temp dir
        const files = fs.readdirSync(tempDir);
        files.forEach((file) => {
          const fp = path.join(tempDir, file);
          if (Date.now() - fs.statSync(fp).mtimeMs > 3600000) {
            // Delete files older than 1 hour
            fs.unlinkSync(fp);
          }
        });
      } catch (cleanupErr) {}

      // User-friendly error
      let errorMsg = "Terjadi kesalahan saat memproses video.";

      if (error.message.includes("Sign in")) {
        errorMsg = "Video ini memerlukan login! Coba video lain.";
      } else if (error.message.includes("private")) {
        errorMsg = "Video ini private atau tidak tersedia!";
      } else if (error.message.includes("copyright")) {
        errorMsg = "Video ini memiliki copyright issue!";
      } else if (error.message.includes("timeout")) {
        errorMsg = "Download timeout! Coba lagi atau pilih video lebih pendek.";
      } else if (error.message.includes("decipher")) {
        errorMsg =
          "YouTube sedang update sistem! Gunakan `/radio` untuk instant access.";
      }

      await interaction.editReply({
        content: `❌ **${errorMsg}**\n\n*Alternatif: Ketik \`/radio\` untuk radio stream yang always work!*`,
      });
    }
  },
};

// Upload to multiple services with fallback
async function uploadFile(filePath) {
  const uploaders = [
    // Uploader 1: Catbox.moe (most reliable)
    async () => {
      try {
        console.log("Trying Catbox.moe...");
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("fileToUpload", fs.createReadStream(filePath));

        const response = await axios.post(
          "https://catbox.moe/user/api.php",
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
            timeout: 180000,
          }
        );

        if (response.data && response.data.includes("https://")) {
          console.log("✅ Catbox success");
          return response.data.trim();
        }
      } catch (err) {
        console.log("❌ Catbox failed:", err.message);
      }
      return null;
    },

    // Uploader 2: File.io
    async () => {
      try {
        console.log("Trying File.io...");
        const form = new FormData();
        form.append("file", fs.createReadStream(filePath));

        const response = await axios.post("https://file.io", form, {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 180000,
        });

        if (response.data && response.data.success && response.data.link) {
          console.log("✅ File.io success");
          return response.data.link;
        }
      } catch (err) {
        console.log("❌ File.io failed:", err.message);
      }
      return null;
    },

    // Uploader 3: 0x0.st
    async () => {
      try {
        console.log("Trying 0x0.st...");
        const form = new FormData();
        form.append("file", fs.createReadStream(filePath));

        const response = await axios.post("https://0x0.st", form, {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 180000,
        });

        if (response.data && response.data.includes("https://")) {
          console.log("✅ 0x0.st success");
          return response.data.trim();
        }
      } catch (err) {
        console.log("❌ 0x0.st failed:", err.message);
      }
      return null;
    },

    // Uploader 4: Litterbox (temporary 1 hour)
    async () => {
      try {
        console.log("Trying Litterbox...");
        const form = new FormData();
        form.append("reqtype", "fileupload");
        form.append("time", "1h");
        form.append("fileToUpload", fs.createReadStream(filePath));

        const response = await axios.post(
          "https://litterbox.catbox.moe/resources/internals/api.php",
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
            timeout: 180000,
          }
        );

        if (response.data && response.data.includes("https://")) {
          console.log("✅ Litterbox success (1 hour expiry)");
          return response.data.trim();
        }
      } catch (err) {
        console.log("❌ Litterbox failed:", err.message);
      }
      return null;
    },
  ];

  // Try each uploader
  for (const uploader of uploaders) {
    const url = await uploader();
    if (url) {
      return url;
    }
  }

  return null;
}