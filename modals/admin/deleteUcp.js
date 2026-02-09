const { pool } = require("../../functions/database");
const config = require("../../config.json");

module.exports = {
  customId: "deleteUcp",
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
    const ucpName = interaction.fields.getTextInputValue("nameInput");

    try {
      const [ucpData] = await pool.execute(
        "SELECT * FROM ucp WHERE ucp = ?",
        [ucpName]
      );

      if (ucpData.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Data not found")
              .setDescription("Nama UCP tidak ditemukan di database.")
          ],
          ephemeral: true,
        });
      }

      await pool.execute("DELETE FROM ucp WHERE ucp = ?", [ucpName]);

      const [usersWithMasters] = await pool.execute(
        "SELECT reg_id, ucp FROM players WHERE ucp LIKE ?",
        [`%${ucpName}%`]
      );

      for (const user of usersWithMasters) {
        if (user.Masters && typeof user.Masters === "string") {
          const mastersArray = user.Masters.split(",").map((master) =>
            master.trim()
          );

          if (mastersArray.includes(ucpName)) {
            await pool.execute("DELETE FROM players WHERE reg_id = ?", [
              user.pID,
            ]);
          }
        }
      }

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle("Success")
            .setDescription(`Berhasil menghapus UCP: **${ucpName}** beserta semua characternya.`),
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
            .setDescription("Terjadi kesalahan saat menghapus UCP."),
        ],
        ephemeral: true,
      });
    }
  },
};
