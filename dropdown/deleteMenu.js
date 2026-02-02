const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");
const config = require("../config.json");

module.exports = {
  customId: "deleteMenu",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    const selectedOption = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(selectedOption)
      .setTitle(
        selectedOption === "deleteUcp" ? "Hapus UCP" : "Hapus Character"
      );

    const inputField = new TextInputBuilder()
      .setCustomId("nameInput")
      .setLabel(
        selectedOption === "deleteUcp"
          ? "Masukkan nama UCP yang ingin dihapus"
          : "Masukkan nama Character yang ingin dihapus"
      )
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(inputField);

    modal.addComponents(row);

    await interaction.showModal(modal);
  },
};
