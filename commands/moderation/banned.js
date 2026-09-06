// ============================================
// FILE: commands/admin/ban.js
// ============================================
const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const mysql = require("mysql2/promise");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a player from the server")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Player name (UCP)")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("time")
        .setDescription("Ban duration in days (0 = permanent)")
        .setRequired(true)
        .setMinValue(0)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Ban reason")
        .setRequired(true)
    ),

  async execute(interaction) {
    // Check admin role
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
       return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Akses Ditolak")
            .setDescription("Anda tidak memiliki izin untuk mengakses fitur ini!")
        ],
        ephemeral: true,
      });
    }

    // Auto-replace spasi dengan underscore
    let playerName = interaction.options.getString("name");
    playerName = playerName.replace(/ /g, "_");    
    
    const banTime = interaction.options.getInteger("time");
    const banReason = interaction.options.getString("reason");
    const discordUser = interaction.user.tag;

    await interaction.deferReply();

    try {
      const conn = await mysql.createConnection(config.database);

      // Check if player exists
      const [playerRows] = await conn.execute(
        "SELECT ucp FROM playerucp WHERE ucp = ?",
        [playerName]
      );

      if (playerRows.length === 0) {
        await conn.end();
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Error")
              .setDescription(`Player \`${playerName}\` tidak ditemukan!`),
          ],
        });
      }

      // Check if already banned
      const currentTime = Math.floor(Date.now() / 1000);
      const [banCheck] = await conn.execute(
        "SELECT * FROM banneds WHERE name = ? AND (ban_expire = 0 OR ban_expire > ?)",
        [playerName, currentTime]
      );

      if (banCheck.length > 0) {
        await conn.end();
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Error")
              .setDescription(`Player \`${playerName}\` telah di banned!`),
          ],
        });
      }

      // Calculate ban expire time
      const banDate = currentTime;
      const banExpire = banTime === 0 ? 0 : currentTime + banTime * 86400;

      // Get player IP (set default jika tidak ada field IP di playerucp)
      const playerIP = "0.0.0.0";

      // Insert ban to database
      await conn.execute(
        `INSERT INTO banneds (name, ip, longip, ban_expire, ban_date, last_activity_timestamp, admin, reason) 
         VALUES (?, ?, INET_ATON(?), ?, ?, ?, ?, ?)`,
        [
          playerName,
          playerIP,
          playerIP,
          banExpire,
          banDate,
          banDate,
          `Discord @${discordUser}`,
          banReason,
        ]
      );

      await conn.end();

      // Calculate expiry date string
      let expireText;
      if (banTime === 0) {
        expireText = "**PERMANENT**";
      } else {
        expireText = `**${banTime} hari** (<t:${banExpire}:F>)`;
      }

      // Success embed
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Player Banned")
        .addFields(
          {
            name: "👤 Player Name",
            value: `\`${playerName}\``,
            inline: true,
          },
          { name: "IP Address", value: `\`${playerIP}\``, inline: true },
          { name: "Duration", value: expireText, inline: true },
          { name: "Reason", value: `\`${banReason}\``, inline: false },
          { name: "Banned By", value: `${discordUser}`, inline: true },
          { name: "Ban Date", value: `<t:${banDate}:F>`, inline: true }
        )
        .setTimestamp()
        .setFooter({
          text: "Valencia Roleplay • Ban System",
          iconURL: interaction.guild.iconURL(),
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Ban command error:", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Error")
            .setDescription(`**Error:** ${error.message}`),
        ],
      });
    }
  },
};