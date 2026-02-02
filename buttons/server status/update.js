const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");
const config = require("../../config.json");
module.exports = {
  customId: "update-logs",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    const modal = new ModalBuilder()
      .setCustomId("update-log-modal")
      .setTitle("📝 Tambah Logs Update");

    const versionInput = new TextInputBuilder()
      .setCustomId("version")
      .setLabel("Masukkan Versi Update")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(20);

    const logsInput = new TextInputBuilder()
      .setCustomId("logs")
      .setLabel("Masukkan Logs Update")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(3000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(versionInput),
      new ActionRowBuilder().addComponents(logsInput)
    );

    await interaction.showModal(modal);
  },
};
