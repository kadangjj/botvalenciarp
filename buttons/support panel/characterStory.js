const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const { pool } = require("../../functions/database");

module.exports = {
  customId: "character_story",
  async execute(interaction) {
    const DiscordID = interaction.user.id;

    const [rows] = await pool.query("SELECT * FROM playerucp WHERE DiscordID = ?", [
      DiscordID,
    ]);

    if (rows.length === 0) {
      return interaction.reply({
        content:
          "❌ Anda belum terdaftar di UCP. Silakan daftar terlebih dahulu.",
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("character_story")
      .setTitle("Daftarkan Character Story");

    const characterNameInput = new TextInputBuilder()
      .setCustomId("ic_name")
      .setLabel("Nama Karakter")
      .setPlaceholder("Masukkan nama karakter Anda")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const characterStoryInput = new TextInputBuilder()
      .setCustomId("cs_content")
      .setLabel("Character Story")
      .setPlaceholder("Masukkan cerita karakter Anda")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(characterNameInput),
      new ActionRowBuilder().addComponents(characterStoryInput)
    );

    await interaction.showModal(modal);
  },
};
