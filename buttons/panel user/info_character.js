const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const { pool } = require("../../functions/database");
const { getUserCharacters } = require("../../functions/dataFunction");

module.exports = {
  customId: "info_character",
  async execute(interaction) {
    const DiscordID = interaction.user.id;

    const [userData] = await pool.execute(
      "SELECT * FROM playerucp WHERE DiscordID = ?",
      [DiscordID]
    );

    if (userData.length === 0) {
      return interaction.reply({
        content: "Anda belum mendaftar. Silakan daftar terlebih dahulu.",
        ephemeral: true,
      });
    }

    const ucpName = userData[0].ucp;

    const characters = await getUserCharacters(ucpName);

    if (characters.length === 0) {
      return interaction.reply({
        content: "Anda belum memiliki karakter.",
        ephemeral: true,
      });
    }

    const charactersWithLevels = [];
    for (let char of characters) {
      const [charData] = await pool.execute(
        "SELECT level FROM players WHERE username = ?",
        [char]
      );
      if (charData.length > 0) {
        charactersWithLevels.push({
          name: char,
          level: charData[0].level,
        });
      }
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select_character_dropdown")
      .setPlaceholder("Pilih karakter Anda")
      .addOptions(
        charactersWithLevels.map((char) => ({
          label: `${char.name} - Level ${char.level}`,
          value: char.name,
        }))
      );

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);

    const selectCharacterEmbed = new EmbedBuilder()
      .setTitle("📋 Info Karakter")
      .setDescription("Silakan pilih karakter Anda untuk melihat detailnya.")
      .setColor("#0D6EFD");

    await interaction.reply({
      embeds: [selectCharacterEmbed],
      components: [actionRow],
      ephemeral: true,
    });
  },
};
