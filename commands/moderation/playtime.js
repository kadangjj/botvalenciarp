const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mysql = require("mysql2/promise");
const { pool } = require("../../functions/database");


// Convert hours, minutes, seconds to readable format
function formatPlaytime(hours, minutes, seconds) {
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  if (h > 0) {
    return `${h}h ${m}m`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
}

// Get medal emoji based on rank
function getMedal(rank) {
  switch(rank) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return `**#${rank}**`;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playtime")
    .setDescription("View top players by playtime")
    .addIntegerOption(option =>
      option
        .setName("limit")
        .setDescription("Number of players to show (default: 10, max: 25)")
        .setMinValue(5)
        .setMaxValue(25)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const limit = interaction.options.getInteger("limit") || 10;

    try {
      // Query untuk ambil top players by playtime
      const [players] = await pool.execute(
        `SELECT 
          username,
          level,
          hours,
          minutes,
          seconds,
          (hours * 3600 + minutes * 60 + seconds) as total_seconds
        FROM players 
        WHERE hours > 0 OR minutes > 0 OR seconds > 0
        ORDER BY total_seconds DESC 
        LIMIT ?`,
        [limit]
      );

      if (players.length === 0) {
        return interaction.editReply({
          content: "❌ No playtime data found.",
          ephemeral: true,
        });
      }

      // Build leaderboard description
      let leaderboard = "";
      
      players.forEach((player, index) => {
        const rank = index + 1;
        const medal = getMedal(rank);
        const playtime = formatPlaytime(player.hours, player.minutes, player.seconds);
        const totalHours = Math.floor(player.total_seconds / 3600);
        
        // Format: 🥇 **PlayerName** • Level 5 • 123h 45m
        leaderboard += `${medal} **${player.username}** • Lvl ${player.level}\n`;
        leaderboard += `⏱️ \`${playtime}\` *(${totalHours.toLocaleString()}h total)*\n\n`;
      });

      // Calculate total playtime of all top players
      const totalPlaytime = players.reduce((sum, p) => sum + p.total_seconds, 0);
      const avgPlaytime = Math.floor(totalPlaytime / players.length / 3600);

      const embed = new EmbedBuilder()
        .setTitle("🏆 Playtime Leaderboard")
        .setDescription(leaderboard || "No data available")
        .setColor("#FFD700")
        .addFields(
          {
            name: "📊 Statistics",
            value: `**Total Players**: ${players.length}\n**Average Playtime**: ${avgPlaytime}h`,
            inline: true
          },
          {
            name: "👑 Top Player",
            value: `**${players[0].username}**\n${formatPlaytime(players[0].hours, players[0].minutes, players[0].seconds)}`,
            inline: true
          }
        )
        .setFooter({ text: `Valencia Roleplay • Top ${limit} Players` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error fetching playtime leaderboard:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching the leaderboard.",
        ephemeral: true,
      });
    }
  },
};