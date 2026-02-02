const { pool } = require("../../functions/database");
const config = require("../../config.json");

module.exports = {
  customId: "changeUCPModal",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    const currentName = interaction.fields.getTextInputValue("currentName");
    const newName = interaction.fields.getTextInputValue("newName");

    if (currentName === newName) {
      return interaction.reply({
        content: "Nama UCP baru tidak boleh sama dengan nama UCP saat ini.",
        ephemeral: true,
      });
    }

    const [currentResult] = await pool.execute(
      "SELECT * FROM playerucp WHERE ucp = ?",
      [currentName]
    );
    if (currentResult.length === 0) {
      return interaction.reply({
        content: "Nama UCP tidak ditemukan.",
        ephemeral: true,
      });
    }

    const [newNameResult] = await pool.execute(
      "SELECT * FROM playerucp WHERE ucp = ?",
      [newName]
    );
    if (newNameResult.length > 0) {
      return interaction.reply({
        content: "Nama UCP baru sudah digunakan. Silakan pilih nama lain.",
        ephemeral: true,
      });
    }

    await pool.execute("UPDATE playerucp SET ucp = ? WHERE ucp = ?", [
      newName,
      currentName,
    ]);

    const [usersResult] = await pool.execute(
      "SELECT reg_id, ucp FROM players WHERE ucp LIKE ?",
      [`%${currentName}%`]
    );

    for (const user of usersResult) {
      if (user.Masters && typeof user.Masters === "string") {
        const updatedMasters = user.Masters.split(",")
          .map((master) => (master.trim() === currentName ? newName : master))
          .join(", ");

        if (updatedMasters !== user.Masters) {
          await pool.execute(
            "UPDATE players SET ucp = ? WHERE reg_id = ?",
            [updatedMasters, user.pID]
          );
        }
      }
    }

    await interaction.reply({
      content: `Nama UCP berhasil diubah dari **${currentName}** menjadi **${newName}**!`,
      ephemeral: true,
    });
  },
};
