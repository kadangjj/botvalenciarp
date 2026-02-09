const {
  EmbedBuilder,
} = require("discord.js");
const { pool } = require("../../functions/database");
const { validateICOwner } = require("../../functions/validate_ic_owner");
const { writeFileSync, readFileSync } = require("fs");
const config = require("../../config.json");

// Fungsi untuk menghapus pending request dari JSON
function removePendingRequest(characterName) {
  const dataPath = "./data/pending_requests.json";
  try {
    let data = JSON.parse(
      readFileSync(dataPath, "utf8") || '{"pendingRequests": []}'
    );

    // Hapus request dengan character name yang sama
    data.pendingRequests = data.pendingRequests.filter(
      req => req.characterName !== characterName
    );

    writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`Removed pending request for ${characterName}`);
  } catch (error) {
    console.error("Error removing pending request:", error);
  }
}

// Fungsi validasi Character Story
// Fungsi validasi Character Story
function validateCharacterStory(story) {
  const errors = [];
  
  // 1. Cek kata alay/tidak formal (dengan word boundary)
  const alayWords = ['gue', 'gw', 'lu', 'loe', 'gua', 'ane', 'gan', 'wkwk', 'njir', 'anjay', 'kuy', 'ygy'];
  const storyLower = story.toLowerCase();
  const foundAlay = alayWords.filter(word => {
    // Cek dengan word boundary (spasi, tanda baca, awal/akhir kalimat)
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(storyLower);
  });
  
  if (foundAlay.length > 0) {
    errors.push(`Menggunakan kata tidak formal: ${foundAlay.join(', ')}`);
  }

  // 2. Cek sudut pandang (tidak boleh ada aku/saya/gue) dengan word boundary
  const firstPersonWords = ['aku', 'saya', 'gue', 'gua', 'ane'];
  const foundFirstPerson = firstPersonWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(storyLower);
  });
  
  if (foundFirstPerson) {
    errors.push('Menggunakan sudut pandang orang pertama (harus orang ketiga)');
  }

  // 3. Cek jumlah paragraf (minimal 3)
  const paragraphs = story.trim().split('\n\n').filter(p => p.trim().length > 0);
  if (paragraphs.length < 3) {
    errors.push(`Paragraf kurang (minimal 3, Anda: ${paragraphs.length})`);
  }

  // 4. Cek jumlah kata (minimal 200)
  const wordCount = story.trim().split(/\s+/).length;
  if (wordCount < 200) {
    errors.push(`Kata kurang (minimal 200, Anda: ${wordCount})`);
  }

  // 5. Cek unsur superhero/tidak realistis
  const unrealisticWords = ['superhero', 'kebal', 'kekuatan super', 'sihir', 'ajaib', 'terbang', 'teleport', 'immortal', 'abadi'];
  const foundUnrealistic = unrealisticWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(storyLower);
  });
  
  if (foundUnrealistic.length > 0) {
    errors.push(`Mengandung unsur tidak realistis: ${foundUnrealistic.join(', ')}`);
  }

  // 6. Cek nama terkenal/brand
  const famousNames = ['ronaldo', 'messi', 'nike', 'adidas', 'elon musk', 'mark zuckerberg', 'jokowi', 'prabowo'];
  const foundFamous = famousNames.filter(name => {
    const regex = new RegExp(`\\b${name}\\b`, 'i');
    return regex.test(storyLower);
  });
  
  if (foundFamous.length > 0) {
    errors.push(`Menggunakan nama terkenal/brand: ${foundFamous.join(', ')}`);
  }

  // 7. Cek OOC
  const oocWords = ['ooc', 'admin', 'player', 'afk', 'brb', 'meta', 'powergaming', 'metagaming'];
  const foundOOC = oocWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(storyLower);
  });
  
  if (foundOOC.length > 0) {
    errors.push(`Mengandung unsur OOC: ${foundOOC.join(', ')}`);
  }

  // 8. Cek SARA/pornografi (kata kasar)
  const forbiddenWords = ['kontol', 'memek', 'ngentot', 'anjing', 'babi', 'tolol'];
  const foundForbidden = forbiddenWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(storyLower);
  });
  
  if (foundForbidden) {
    errors.push('Mengandung kata tidak pantas/SARA');
  }

  return errors;
}
module.exports = {
  customId: "character_story",
  async execute(interaction) {
    const characterName = interaction.fields.getTextInputValue("ic_name");
    const story = interaction.fields.getTextInputValue("cs_content");
    const DiscordID = interaction.user.id;

    console.log("Received Inputs:");
    console.log("Discord ID:", DiscordID);
    console.log("Character Name:", characterName);

    // Validasi kepemilikan karakter
    const isValid = await validateICOwner(DiscordID, characterName);
    if (!isValid) {
      console.error(
        `Validation failed for Discord ID: ${DiscordID}, Character Name: ${characterName}`
      );
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Validasi Gagal")
            .setDescription("Nama karakter bukan milik Anda!")
        ],
        ephemeral: true,
      });
    }

    console.log("Validation succeeded!");

    // Cek level dan character story
    try {
      const query = `SELECT level, characterstory FROM players WHERE username = ?`;
      const [results] = await pool.query(query, [characterName]);

      console.log("Query Results:", results);
      
      if (results.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Karakter Tidak Ditemukan")
              .setDescription("Karakter tidak ditemukan dalam database!")
          ],
          ephemeral: true,
        });
      }

      // Cek level minimal 3
      const characterLevel = Number(results[0].level);
      if (characterLevel < 3) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Level Tidak Mencukupi")
              .setDescription(`Karakter **${characterName}** harus minimal **Level 3** untuk membuat character story.\n\n**Level saat ini:** ${characterLevel}\n**Level minimal:** 3`)
              .setFooter({ text: "Main dulu untuk naik level!" })
          ],
          ephemeral: true,
        });
      }

      // Cek apakah sudah punya character story
      if (Number(results[0].characterstory) === 1) {
        console.log(`Character ${characterName} already has a story.`);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Sudah Memiliki Story")
              .setDescription(`Karakter **${characterName}** sudah memiliki character story!`)
          ],
          ephemeral: true,
        });
      }
      
    } catch (error) {
      console.error("Database query error:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Kesalahan Database")
            .setDescription("Terjadi kesalahan saat memeriksa data karakter!")
        ],
        ephemeral: true,
      });
    }

    // VALIDASI CHARACTER STORY
    const validationErrors = validateCharacterStory(story);

    // AUTO REJECT jika ada error
    if (validationErrors.length > 0) {
      // Hapus dari pending jika ada
      removePendingRequest(characterName);
      
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Character Story Ditolak")
            .setDescription(`Character story untuk **${characterName}** tidak memenuhi syarat.`)
            .addFields({
              name: "Kesalahan yang ditemukan:",
              value: validationErrors.map((error, index) => `${index + 1}. ${error}`).join('\n'),
              inline: false
            })
            .addFields({
              name: "Syarat Character Story",
              value: "• **Level minimal 3**\n• Minimal 200 kata dan 3 paragraf\n• Menggunakan bahasa formal (EYD)\n• Sudut pandang orang ketiga\n• Tidak mengandung OOC/nama terkenal\n• Realistis sesuai roleplay GTA SA"
            })
        ],
        ephemeral: true,
      });
    }

    // AUTO APPROVE jika lolos validasi
    try {
      const updateQuery = `UPDATE players SET characterstory = 1 WHERE username = ?`;
      await pool.query(updateQuery, [characterName]);

      // Hapus dari pending requests
      removePendingRequest(characterName);

      console.log(`Character story auto-approved for ${characterName}`);

      // Log ke admin channel
      const adminChannel = interaction.client.channels.cache.get(
        config.channels.adminLogsCS
      );
      
      if (adminChannel) {
        const wordCount = story.trim().split(/\s+/).length;
        const paragraphCount = story.trim().split('\n\n').filter(p => p.trim().length > 0).length;

        const logEmbed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle("Character Story Auto-Approved")
          .setDescription(`Story untuk **${characterName}** telah disetujui otomatis.`)
          .addFields(
            { name: "Nama IC", value: characterName, inline: true },
            { name: "Diajukan Oleh", value: `<@${DiscordID}>`, inline: true },
            { name: "Statistik", value: `${wordCount} kata | ${paragraphCount} paragraf`, inline: true },
            { name: "Story", value: story.length > 1000 ? story.substring(0, 1000) + "..." : story }
          )
          .setTimestamp()
          .setFooter({
            text: `Auto-approved by system`,
            iconURL: interaction.user.displayAvatarURL(),
          });

        await adminChannel.send({ embeds: [logEmbed] });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle("Character Story Disetujui!")
            .setDescription(`Character story untuk **${characterName}** telah disetujui dan disimpan!\n\nSelamat bermain di Valencia Roleplay!`)
            .addFields({
              name: "Status",
              value: "Approved secara otomatis"
            })
        ],
        ephemeral: true,
      });

    } catch (error) {
      console.error("Error updating database:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Kesalahan Sistem")
            .setDescription("Gagal menyimpan character story ke database!")
        ],
        ephemeral: true,
      });
    }
  },
};