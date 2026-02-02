// ============================================
// FILE: commands/admin/setadmin.js
// ============================================
const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const mysql = require("mysql2/promise");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setadmin")
    .setDescription("Set admin level to a player (OFFLINE ONLY)")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Player name")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("level")
        .setDescription("Admin level (0-6)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(6)
    ),
  async execute(interaction) {
    // Check admin role
    if (!interaction.member.roles.cache.has(config.roles.serversupport)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }

    const playerName = interaction.options.getString("name");
    const adminLevel = interaction.options.getInteger("level");
    const discordUser = interaction.user.tag;

    await interaction.deferReply();

    try {
      const conn = await mysql.createConnection(config.database);

      // Check if player exists in database
      const [playerRows] = await conn.execute(
        "SELECT username, admin FROM players WHERE username = ?",
        [playerName]
      );

      if (playerRows.length === 0) {
        await conn.end();
        return interaction.editReply({
          content: `❌ **Error:** Player \`${playerName}\` tidak ditemukan di database!`,
        });
      }

      const currentAdmin = playerRows[0].admin;

      // Update admin level
      await conn.execute(
        "UPDATE players SET admin = ? WHERE username = ?",
        [adminLevel, playerName]
      );

      await conn.end();

      // Success embed
      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("✅ Set Admin Level Sukses")
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
            name: "🔰 Admin Level",
            value: `${currentAdmin} ➜ **${adminLevel}**`,
            inline: true,
          },
          {
            name: "👮 Set By",
            value: `${discordUser}`,
            inline: true,
          },
          {
            name: "📝 Info",
            value: `Player telah berhasil di set admin level **${adminLevel}**.`,
            inline: false,
          }
        )
        .setTimestamp()
        .setFooter({
          text: "Valencia Roleplay • Admin System",
          iconURL: interaction.guild.iconURL(),
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("SetAdmin command error:", error);
      await interaction.editReply({
        content: `❌ **Error:** ${error.message}`,
      });
    }
  },
};