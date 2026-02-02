const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  customId: /^reject_cs_.+/,
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    const characterName = interaction.customId.replace("reject_cs_", "");
    const modal = new ModalBuilder()
      .setCustomId(`reject_reason_${characterName}`)
      .setTitle("Alasan Penolakan")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("reason")
            .setLabel("Alasan Penolakan")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        )
      );

    await interaction.showModal(modal);
  },
};
