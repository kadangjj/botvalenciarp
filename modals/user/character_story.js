const { EmbedBuilder, MessageFlags } = require("discord.js");
const { pool } = require("../../functions/database");
const { validateICOwner } = require("../../functions/validate_ic_owner");
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
function validateCharacterStory(story, characterName) {
  const errors = [];
  
  // 0. Cek apakah story menyebutkan nama karakter
  const firstName = characterName.split('_')[0];
  const lastName = characterName.split('_')[1];
  const storyLower = story.toLowerCase();
  
  const firstNameRegex = new RegExp(`\\b${firstName}\\b`, 'i');
  const lastNameRegex = new RegExp(`\\b${lastName}\\b`, 'i');
  
  if (!firstNameRegex.test(story) && !lastNameRegex.test(story)) {
    errors.push(`Story harus menyebutkan nama karakter (${firstName} atau ${lastName})`);
  }

  // 0.5. Cek kata yang masuk akal (deteksi gibberish/random words)
  const words = story.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  // Cek pola konsonan berlebihan (kata Indonesia jarang punya 4+ konsonan berturut)
  const gibberishWords = words.filter(word => {
    // Lebih dari 4 konsonan berturut-turut
    if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(word)) return true;
    // Tidak ada vokal sama sekali tapi panjang > 3
    if (word.length > 3 && !/[aiueo]/i.test(word)) return true;
    // Pola huruf yang tidak natural (misal: qxzjk)
    if (/[qxz]{2,}/i.test(word)) return true;
    return false;
  });
  
  if (gibberishWords.length > 3) {
    errors.push(`Terdeteksi ${gibberishWords.length} kata tidak wajar: ${gibberishWords.slice(0, 3).join(', ')}...`);
  }

  // 0.6. Cek kata berulang (spam)
  const wordFrequency = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });
  
  const totalWords = words.length;
  for (const [word, count] of Object.entries(wordFrequency)) {
    if (count > totalWords * 0.15) {
      errors.push(`Kata "${word}" terlalu sering diulang (${count} kali)`);
      break;
    }
  }

  // 0.7. Cek keyboard mashing pattern
  const keyboardPatterns = [
    /asdf/gi, /qwer/gi, /zxcv/gi, /hjkl/gi,
    /(.)\1{4,}/gi, // 5 huruf sama berturut
    /(?:qw|we|er|rt|ty|yu|ui|io|op|as|sd|df|fg|gh|hj|jk|kl|zx|xc|cv|vb|bn|nm){3,}/gi // Keyboard sequence
  ];
  
  for (const pattern of keyboardPatterns) {
    if (pattern.test(story)) {
      errors.push('Story mengandung huruf acak (keyboard mashing)');
      break;
    }
  }

  // 0.8. Cek minimal kata umum Bahasa Indonesia (simple dictionary check)
  const commonIndonesianWords = [
    'yang', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'adalah', 'ini', 'itu',
    'dan', 'atau', 'juga', 'sangat', 'sudah', 'akan', 'telah', 'sedang', 'tidak',
    'ada', 'dalam', 'oleh', 'seperti', 'antara', 'sebagai', 'karena', 'namun',
    'tetapi', 'jika', 'maka', 'saat', 'ketika', 'saya', 'dia', 'mereka', 'ia',
    'tahun', 'hari', 'kota', 'rumah', 'sekolah', 'keluarga', 'orang', 'anak'
  ];
  
  const foundCommonWords = commonIndonesianWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(storyLower);
  });
  
  // Story 200+ kata harus minimal ada 10 kata umum
  if (foundCommonWords.length < 10) {
    errors.push('Story kurang natural. Gunakan Bahasa Indonesia yang benar');
  }

  // 0.9. Cek rasio huruf vokal vs konsonan
  const vowels = story.match(/[aiueo]/gi) || [];
  const consonants = story.match(/[bcdfghjklmnpqrstvwxyz]/gi) || [];
  const vowelRatio = vowels.length / (vowels.length + consonants.length);
  
  if (vowelRatio < 0.3 || vowelRatio > 0.6) {
    errors.push('Komposisi huruf tidak wajar (kemungkinan teks random)');
  }

  // 0.10. Cek panjang rata-rata kata
  const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  if (averageWordLength < 3.5 || averageWordLength > 10) {
    errors.push('Panjang kata tidak natural');
  }

  // 0.11. Cek minimal tanda baca
  const punctuationCount = (story.match(/[.,!?;:]/g) || []).length;
  if (punctuationCount < 8) {
    errors.push('Story kurang tanda baca (minimal 8 tanda baca)');
  }

  // 1. Cek kata alay/tidak formal
  const alayWords = ['gue', 'gw', 'lu', 'loe', 'gua', 'ane', 'gan', 'wkwk', 'njir', 'anjay', 'kuy', 'ygy'];
  const foundAlay = alayWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(storyLower);
  });
  
  if (foundAlay.length > 0) {
    errors.push(`Menggunakan kata tidak formal: ${foundAlay.join(', ')}`);
  }

  // 2. Cek sudut pandang
  const firstPersonWords = ['aku', 'saya', 'gue', 'gua', 'ane'];
  const foundFirstPerson = firstPersonWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(storyLower);
  });
  
  if (foundFirstPerson) {
    errors.push('Menggunakan sudut pandang orang pertama (harus orang ketiga)');
  }

  // 3. Cek jumlah paragraf
  const paragraphs = story.trim().split('\n\n').filter(p => p.trim().length > 0);
  if (paragraphs.length < 3) {
    errors.push(`Paragraf kurang (minimal 3, Anda: ${paragraphs.length})`);
  }

  // 3.5. Cek setiap paragraf minimal 4 kalimat
  for (let i = 0; i < paragraphs.length; i++) {
    const sentences = paragraphs[i].split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length < 4) {
      errors.push(`Paragraf ${i + 1} kurang kalimat (minimal 4 kalimat bermakna)`);
      break;
    }
  }

  // 4. Cek jumlah kata
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

  // 8. Cek SARA/kata kasar
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
        flags: MessageFlags.Ephemeral
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
          flags: MessageFlags.Ephemeral
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
          flags: MessageFlags.Ephemeral
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
          flags: MessageFlags.Ephemeral
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
        flags: MessageFlags.Ephemeral
      });
    }

    // VALIDASI CHARACTER STORY
    const validationErrors = validateCharacterStory(story, characterName);

    // AUTO REJECT jika ada error
    if (validationErrors.length > 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Character Story Ditolak")
            .setDescription(
              `Character story untuk **${characterName}** tidak memenuhi syarat.\n\n**Kesalahan yang ditemukan:**\n${validationErrors.map((error, index) => `${index + 1}. ${error}`).join('\n')}`
            )
            .addFields({
              name: "Syarat Character Story",
              value: "• **Level minimal 3**\n• Minimal 200 kata dan 3 paragraf\n• Menggunakan bahasa formal (EYD)\n• Sudut pandang orang ketiga\n• Tidak mengandung OOC/nama terkenal\n• Realistis sesuai roleplay GTA SA"
            })
        ],
        flags: MessageFlags.Ephemeral
      });
    }

    // AUTO APPROVE jika lolos validasi
    try {
      const updateQuery = `UPDATE players SET characterstory = 1 WHERE username = ?`;
      await pool.query(updateQuery, [characterName]);

      console.log(`Character story auto-approved for ${characterName}`);

      // Log ke admin channel
     // Log ke admin channel
      const adminChannel = interaction.client.channels.cache.get(
        config.channels.adminLogsCS
      );

      if (adminChannel) {
        const wordCount = story.trim().split(/\s+/).length;
        const paragraphCount = story.trim().split('\n\n').filter(p => p.trim().length > 0).length;

        // Ambil 3 baris pertama sebagai preview
        const storyLines = story.split('\n');
        const preview = storyLines.slice(0, 5).join('\n');
        const previewText = preview.length > 300 
          ? preview.substring(0, 297) + "..." 
          : preview;

        const logEmbed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle("Character Story Auto-Approved")
          .setDescription(`Story untuk **${characterName}** telah disetujui otomatis.`)
          .addFields(
            { name: "Nama IC", value: characterName, inline: true },
            { name: "Diajukan Oleh", value: `<@${DiscordID}>`, inline: true },
            { name: "Statistik", value: `${wordCount} kata | ${paragraphCount} paragraf`, inline: true },
            { name: "Preview", value: `${previewText}\n\n*[Lihat file attachment untuk story lengkap]*` }
          )
          .setTimestamp()
          .setFooter({
            text: `Auto-approved by system`,
            iconURL: interaction.user.displayAvatarURL(),
          });

        // Kirim story lengkap sebagai file
        const { AttachmentBuilder } = require('discord.js');
        const buffer = Buffer.from(story, 'utf-8');
        const attachment = new AttachmentBuilder(buffer, { 
          name: `${characterName}_story.txt` 
        });

        await adminChannel.send({ 
          embeds: [logEmbed], 
          files: [attachment] 
        });
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
        flags: MessageFlags.Ephemeral
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
        flags: MessageFlags.Ephemeral
      });
    }
  },
};