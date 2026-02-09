const { pool } = require("../../functions/database");
const config = require("../../config.json");
module.exports = {
  customId: "deleteCharacter",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Akses Ditolak")
            .setDescription("Anda tidak memiliki izin untuk mengakses fitur ini!")
        ],
        ephemeral: true,
      });
    }
    const charName = interaction.fields.getTextInputValue("nameInput");

    try {
      const [charData] = await pool.execute(
        "SELECT * FROM players WHERE username = ?",
        [charName]
      );

      if (charData.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Data not found")
              .setDescription("Nama karakter tidak ditemukan di database.")
          ],
          ephemeral: true,
        });
      }

      await pool.execute("DELETE FROM players WHERE username = ?", [charName]);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle("Success")
            .setDescription(`Berhasil menghapus karakter: **${charName}**`),
        ],
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Error")
            .setDescription("Terjadi kesalahan saat menghapus karakter."),
        ],
        ephemeral: true,
      });
    }
  },
};
