const { Embed } = require("discord.js");
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
          embeds: [
            new EmbedBuilder()
              .setTitle("Akun Tidak Terdaftar")
              .setDescription("Akun Discord ini tidak terdaftar di server. Silakan register terlebih dahulu.")
              .setColor(0xff0000)
          ],
          ephemeral: true,
        });
      }

      const roleCitizen = interaction.guild.roles.cache.get(
        config.roles.roleCitizen
      );
      const member = interaction.guild.members.cache.get(DiscordID);

      if (!roleCitizen) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Role Tidak Ditemukan")
              .setDescription("Role 'Verified' tidak ditemukan. Hubungi admin untuk bantuan.")
              .setColor(0xffa500)
          ],
          ephemeral: true,
        });
      }

      if (member.roles.cache.has(roleCitizen.id)) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Anda Sudah Terdaftar")
              .setDescription("Anda sudah memiliki Verified role.")
              .setColor(0x00ff00)
          ],
          ephemeral: true,
        });
      }

      await member.roles.add(roleCitizen);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Reverifikasi Berhasil")
            .setDescription("Role Verified berhasil ditambahkan ke akun Anda!")
            .setColor(0x00ff00)
        ],
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Reverifikasi Gagal")
            .setDescription("Terjadi kesalahan saat memverifikasi ulang akun Anda.")
            .setColor(0xff0000)
        ],
        ephemeral: true,
      });
    }
  },
};
