const { pool } = require("../../functions/database");
const config = require("../../config.json");

module.exports = {
  customId: "changeCharacterModal",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    const currentName = interaction.fields.getTextInputValue("currentName");
    const newName = interaction.fields.getTextInputValue("newName");

    // Cek apakah nama baru sama dengan nama lama
    if (currentName === newName) {
       return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Retry Failed")
            .setDescription("Nama karakter baru tidak boleh sama dengan nama karakter saat ini!")
        ],
        ephemeral: true,
      });
    }

    // Cek apakah nama karakter saat ini ada
    const [currentResult] = await pool.execute(
      "SELECT * FROM players WHERE username = ?",
      [currentName]
    );

    if (currentResult.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Data not found")
            .setDescription("Nama karakter tidak ditemukan.")
        ],
        ephemeral: true,
      });
    }

    // Cek apakah nama karakter baru sudah digunakan
    const [newNameResult] = await pool.execute(
      "SELECT * FROM players WHERE username = ?",
      [newName]
    );

    if (newNameResult.length > 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Nama Sudah Digunakan")
            .setDescription("Nama karakter baru sudah digunakan. Silakan pilih nama lain.")
        ],
        ephemeral: true,
      });
    }

    // Perbarui nama karakter
    await pool.execute("UPDATE players SET username = ? WHERE username = ?", [
      newName,
      currentName,
    ]);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle("Success")
          .setDescription(`Nama karakter berhasil diubah dari **${currentName}** menjadi **${newName}**!`),
      ],
      ephemeral: true,
    });
  },
};
