const { EmbedBuilder, MessageFlags } = require("discord.js"); // TAMBAHKAN INI
const { pool } = require("../../functions/database");
const config = require("../../config.json");

module.exports = {
  customId: "reverify",
  async execute(interaction) {
    const DiscordID = interaction.user.id;

    try {
      // Cek apakah user sudah terdaftar
      const [rows] = await pool.query(
        "SELECT ucp FROM playerucp WHERE DiscordID = ?",
        [DiscordID]
      );

      if (rows.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Akun Tidak Ditemukan")
              .setDescription("Anda belum memiliki akun UCP yang terdaftar!")
          ],
          flags: MessageFlags.Ephemeral // GANTI DARI ephemeral: true
        });
      }

      // Berikan role Verified
      const verifiedRole = interaction.guild.roles.cache.get(config.roles.roleCitizen);
      
      if (!verifiedRole) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Error")
              .setDescription("Role Verified tidak ditemukan!")
          ],
          flags: MessageFlags.Ephemeral
        });
      }

      await interaction.member.roles.add(verifiedRole);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle("Reverifikasi Berhasil")
            .setDescription(`Selamat datang kembali! Role **${verifiedRole.name}** telah diberikan.`)
        ],
        flags: MessageFlags.Ephemeral
      });

    } catch (error) {
      console.error("Error in reverify:", error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Terjadi Kesalahan")
            .setDescription("Gagal melakukan reverifikasi. Silakan hubungi admin.")
        ],
        flags: MessageFlags.Ephemeral
      });
    }
  },
};