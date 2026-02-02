const { pool } = require("../functions/database");

module.exports = {
  customId: "select_delete_character",
  async execute(interaction) {
    const selectedCharacter = interaction.values[0];
    const DiscordID = interaction.user.id;

    try {
      const [userData] = await pool.execute(
        "SELECT ucp FROM playerucp WHERE DiscordID = ?",
        [DiscordID]
      );

      if (userData.length === 0) {
        return interaction.reply({
          content: "❌ Akun Anda tidak ditemukan.",
          ephemeral: true,
        });
      }

      const ucpName = userData[0].Username;

      const [characterData] = await pool.execute(
        "SELECT username FROM players WHERE ucp = ? AND username = ?",
        [ucpName, selectedCharacter]
      );

      if (characterData.length === 0) {
        return interaction.reply({
          content:
            "❌ Karakter yang Anda pilih tidak valid atau bukan milik Anda.",
          ephemeral: true,
        });
      }

      await pool.execute("DELETE FROM players WHERE username = ?", [
        selectedCharacter,
      ]);

      await interaction.reply({
        content: `✅ Karakter **${selectedCharacter}** berhasil dihapus.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error deleting character:", error);
      await interaction.reply({
        content:
          "❌ Terjadi kesalahan saat mencoba menghapus karakter. Silakan coba lagi nanti.",
        ephemeral: true,
      });
    }
  },
};
