// ============================================
// FILE: commands/admin/unsetcs.js
// ============================================
const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const mysql = require("mysql2/promise");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unsetcs")
    .setDescription("Remove Character Story from a player (OFFLINE ONLY)")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Player name Character")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Check admin role
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }

    const playerName = interaction.options.getString("name");
    const discordUser = interaction.user.tag;

    await interaction.deferReply();

    try {
      const conn = await mysql.createConnection(config.database);

      // Check if player exists in database
      const [playerRows] = await conn.execute(
        "SELECT username, characterstory FROM players WHERE username = ?",
        [playerName]
      );

      if (playerRows.length === 0) {
        await conn.end();
        return interaction.editReply({
          content: `❌ **Error:** Player \`${playerName}\` tidak ditemukan di database!`,
        });
      }

      const currentCS = playerRows[0].characterstory;

      // Check if player has CS
      if (currentCS !== 1) {
        await conn.end();
        return interaction.editReply({
          content: `❌ **Error:** Player \`${playerName}\` tidak memiliki Character Story!`,
        });
      }

      // Update Character Story to 0
      await conn.execute(
        "UPDATE players SET characterstory = 0 WHERE username = ?",
        [playerName]
      );

      await conn.end();

      // Success embed
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("❌ Character Story Dihapus")
        .addFields(
          {
            name: "👤 Player Name",
            value: `\`${playerName}\``,
            inline: true,
          },
          {
            name: "📋 Status",
            value: "**OFFLINE**",
            inline: true,
          },
          {
            name: "👮 Removed By",
            value: `${discordUser}`,
            inline: true,
          },
          {
            name: "⚠️ Info",
            value: "Player tidak bisa menggunakan senjata saat login.",
            inline: false,
          }
        )
        .setTimestamp()
        .setFooter({
          text: "Valencia Roleplay • CS System",
          iconURL: interaction.guild.iconURL(),
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("UnsetCS command error:", error);
      await interaction.editReply({
        content: `❌ **Error:** ${error.message}`,
      });
    }
  },
};