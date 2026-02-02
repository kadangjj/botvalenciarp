const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const config = require("../config.json");

module.exports = {
  id: "changeDropdown",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    const selected = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(
        selected === "changeUCP" ? "changeUCPModal" : "changeCharacterModal"
      )
      .setTitle(
        selected === "changeUCP"
          ? "🔄 Ganti Nama UCP"
          : "🔄 Ganti Nama Character"
      );

    const currentNameInput = new TextInputBuilder()
      .setCustomId("currentName")
      .setLabel("Nama Saat Ini")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Masukkan nama saat ini")
      .setRequired(true);

    const newNameInput = new TextInputBuilder()
      .setCustomId("newName")
      .setLabel("Nama Baru")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Masukkan nama baru")
      .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(currentNameInput);
    const row2 = new ActionRowBuilder().addComponents(newNameInput);

    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  },
};
