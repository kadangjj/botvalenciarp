const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("../../config.json");

const FAQ_PATH = path.join(__dirname, "../data/faq.json");

module.exports = {
  customId: "faq_button",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    const modal = new ModalBuilder()
      .setCustomId("faq_modal")
      .setTitle("📝 Tambah FAQ");

    const questionInput = new TextInputBuilder()
      .setCustomId("question")
      .setLabel("Pertanyaan FAQ")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Masukkan pertanyaan FAQ")
      .setRequired(true);

    const answerInput = new TextInputBuilder()
      .setCustomId("answer")
      .setLabel("Jawaban FAQ")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("Masukkan jawaban FAQ")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(questionInput),
      new ActionRowBuilder().addComponents(answerInput)
    );

    await interaction.showModal(modal);
  },
};
