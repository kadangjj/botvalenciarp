const { pool } = require("../../functions/database");
const config = require("../../config.json");
module.exports = {
  customId: "deleteCharacter",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
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
          content: "Nama karakter tidak ditemukan di database.",
          ephemeral: true,
        });
      }

      await pool.execute("DELETE FROM players WHERE username = ?", [charName]);

      await interaction.reply({
        content: `Berhasil menghapus karakter: **${charName}**`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Terjadi kesalahan saat menghapus karakter.",
        ephemeral: true,
      });
    }
  },
};
