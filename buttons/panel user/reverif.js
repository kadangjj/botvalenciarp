const config = require("../../config.json");
const { pool } = require("../../functions/database");

module.exports = {
  customId: "reverify",
  async execute(interaction) {
    const DiscordID = interaction.user.id;

    try {
      const [result] = await pool.execute(
        "SELECT * FROM playerucp WHERE DiscordID = ?",
        [DiscordID]
      );

      if (result.length === 0) {
        return interaction.reply({
          content:
            "❌ Akun Discord ini tidak terdaftar di server. Silakan register terlebih dahulu.",
          ephemeral: true,
        });
      }

      const roleCitizen = interaction.guild.roles.cache.get(
        config.roles.roleCitizen
      );
      const member = interaction.guild.members.cache.get(DiscordID);

      if (!roleCitizen) {
        return interaction.reply({
          content:
            "⚠️ Role 'Verified' tidak ditemukan. Hubungi admin untuk bantuan.",
          ephemeral: true,
        });
      }

      if (member.roles.cache.has(roleCitizen.id)) {
        return interaction.reply({
          content: "Anda sudah memiliki Verified role.",
          ephemeral: true,
        });
      }

      await member.roles.add(roleCitizen);

      return interaction.reply({
        content: "✅ Role Verified berhasil ditambahkan ke akun Anda!",
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "❌ Terjadi kesalahan saat memverifikasi ulang akun Anda.",
        ephemeral: true,
      });
    }
  },
};
