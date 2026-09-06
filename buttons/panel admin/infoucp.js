const { EmbedBuilder } = require("discord.js");
const { pool } = require("../../functions/database");
const config = require("../../config.json");

module.exports = {
  customId: "ucpInfoModal",
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

    const ucpName = interaction.fields.getTextInputValue("ucpName").trim();

    try {
      const [characters] = await pool.execute(
        "SELECT * FROM players WHERE ucp = ?",
        [ucpName]
      );

      if (characters.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Data Not Found")
              .setDescription(`UCP **${ucpName}** tidak ditemukan atau tidak memiliki karakter.`)
          ],
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`👤 Karakter UCP: ${ucpName}`)
        .setColor("#0D6EFD")
        .setDescription(`Total karakter: **${characters.length}**`)
        .setTimestamp()
        .setFooter({ text: "Informasi UCP" });

      characters.forEach((char, index) => {
        embed.addFields({
          name: `${index + 1}. ${char.username}`,
          value: `
**Level**: ${char.level}
**Gender**: ${char.gender === 1 ? "Male" : "Female"}
**Admin**: ${char.admin === 0 ? "No Admin" : "Administrator"}
**Playtime**: ${char.hours}j ${char.minutes}m ${char.seconds}d
**Last Login**: ${new Date(char.last_login).toLocaleString('id-ID')}
          `,
          inline: true,
        });
      });

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });

    } catch (error) {
      console.error(error);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Error")
            .setDescription("Terjadi kesalahan saat mengambil informasi UCP.")
        ],
        ephemeral: true,
      });
    }
  },
};