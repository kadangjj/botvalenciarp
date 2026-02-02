const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const { pool } = require("../../functions/database");
const { getUserCharacters } = require("../../functions/dataFunction");

module.exports = {
  customId: "CharacterDetele",
  async execute(interaction) {
    const DiscordID = interaction.user.id;

    const [userData] = await pool.execute(
      "SELECT ucp FROM playerucp WHERE DiscordID = ?",
      [DiscordID]
    );

    if (userData.length === 0) {
      return interaction.reply({
        content: "❌ Anda belum mendaftar. Silakan daftar terlebih dahulu.",
        ephemeral: true,
      });
    }

    const ucpName = userData[0].ucp;

    const characters = await getUserCharacters(ucpName);

    if (characters.length === 0) {
      return interaction.reply({
        content: "❌ Anda belum memiliki karakter.",
        ephemeral: true,
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_delete_character")
      .setPlaceholder("Pilih karakter yang ingin dihapus")
      .addOptions(
        characters.map((char) => ({
          label: char,
          value: char,
        }))
      );

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    const deleteCharacterEmbed = new EmbedBuilder()
      .setTitle("🗑 Hapus Karakter")
      .setDescription("Silakan pilih karakter yang ingin Anda hapus.")
      .setColor("#FF0000");

    await interaction.reply({
      embeds: [deleteCharacterEmbed],
      components: [actionRow],
      ephemeral: true,
    });
  },
};
