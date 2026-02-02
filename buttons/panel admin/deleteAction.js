const {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  customId: "deleteAction",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    const embed = new EmbedBuilder()
      .setTitle("🗑️ Pilih Data yang Ingin Dihapus")
      .setDescription(
        "Silakan pilih data yang ingin dihapus dari dropdown di bawah."
      )
      .setColor("#FF0000")
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("deleteMenu")
      .setPlaceholder("Pilih jenis data")
      .addOptions(
        {
          label: "UCP",
          description: "Hapus UCP berdasarkan nama",
          value: "deleteUcp",
        },
        {
          label: "Character",
          description: "Hapus karakter berdasarkan nama",
          value: "deleteCharacter",
        }
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  },
};
