const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  customId: "reportBug",
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("reportBugModal")
      .setTitle("Report Bug");

    const titleInput = new TextInputBuilder()
      .setCustomId("bugTitle")
      .setLabel("Title/Subject (max 10 characters)")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(10)
      .setRequired(true);

    const descriptionInput = new TextInputBuilder()
      .setCustomId("bugDescription")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const evidenceInput = new TextInputBuilder()
      .setCustomId("bugEvidence")
      .setLabel("Bukti (photo/video link)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const modalRow1 = new ActionRowBuilder().addComponents(titleInput);
    const modalRow2 = new ActionRowBuilder().addComponents(descriptionInput);
    const modalRow3 = new ActionRowBuilder().addComponents(evidenceInput);

    modal.addComponents(modalRow1, modalRow2, modalRow3);

    await interaction.showModal(modal);
  },
};
