// ============================================
// FILE: commands/admin/setvip.js
// ============================================
const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const mysql = require("mysql2/promise");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setvip")
    .setDescription("Set VIP level to a player (OFFLINE ONLY)")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Player name (e.g., Lieva Duscha or Lieva_Duscha)")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("level")
        .setDescription("VIP level (0-3)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(3)
    )
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription("Duration in days (0 for permanent)")
        .setRequired(true)
        .setMinValue(0)
    ),
  async execute(interaction) {
    // Check admin role
    if (!interaction.member.roles.cache.has(config.roles.serversupport)) {
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

    const vipLevel = interaction.options.getInteger("level");
    const days = interaction.options.getInteger("days");
    const discordUser = interaction.user.tag;

    // Validate days limit for non-owner admins
    const isOwner = interaction.member.roles.cache.has(config.roles.owner); // Assuming you have owner role
    if (!isOwner && days > 30 && days !== 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Error")
            .setDescription("Anda hanya bisa menset VIP untuk 1-30 hari! (0 untuk permanent)"),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const conn = await mysql.createConnection(config.database);

      // Check if player exists in database
      const [playerRows] = await conn.execute(
        "SELECT username, vip, vip_time FROM players WHERE username = ?",
        [playerName]
      );

      if (playerRows.length === 0) {
        await conn.end();
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Error")
              .setDescription(`Player \`${playerName}\` tidak ditemukan di database!`),
          ],
        });
      }

      const currentVip = playerRows[0].vip;
      const currentVipTime = playerRows[0].viptime;

      // Calculate VIP expiration time
      let vipTime = 0;
      let durationType = "";
      let expirationDate = "";

      if (days === 0) {
        vipTime = 0; // Permanent
        durationType = "Permanent";
        expirationDate = "Never";
      } else {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        vipTime = currentTimestamp + (days * 86400);
        durationType = `${days} days`;
        
        // Format expiration date
        const expDate = new Date(vipTime * 1000);
        expirationDate = expDate.toLocaleString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      // Update VIP level and time
      await conn.execute(
        "UPDATE players SET vip = ?, vip_time = ? WHERE username = ?",
        [vipLevel, vipTime, playerName]
      );

      await conn.end();

      // Get VIP rank name
      const vipRanks = ["None", "Bronze", "Silver", "Gold"];
      const vipRankName = vipRanks[vipLevel] || "Unknown";
      const oldVipRankName = vipRanks[currentVip] || "Unknown";

      // Success embed
      const embed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("Set VIP Level Sukses")
        .setThumbnail(interaction.guild.iconURL())
        .addFields(
          {
            name: "Player Name",
            value: `\`${playerName}\``,
            inline: true,
          },
          {
            name: "Status",
            value: "**OFFLINE**",
            inline: true,
          },
          {
            name: "\u200b",
            value: "\u200b",
            inline: true,
          },
          {
            name: "VIP Level",
            value: `${oldVipRankName} (${currentVip}) ➜ **${vipRankName} (${vipLevel})**`,
            inline: true,
          },
          {
            name: "Duration",
            value: durationType,
            inline: true,
          },
          {
            name: "Expires On",
            value: expirationDate,
            inline: true,
          },
          {
            name: "Set By",
            value: `${discordUser}`,
            inline: false,
          },
          {
            name: "Info",
            value: days === 0 
              ? `Player telah berhasil di set VIP **${vipRankName}** dengan durasi **Permanent**.`
              : `Player telah berhasil di set VIP **${vipRankName}** selama **${days} hari**.`,
            inline: false,
          }
        )
        .setTimestamp()
        .setFooter({
          text: "Valencia Roleplay • VIP System",
          iconURL: interaction.guild.iconURL(),
        });

      await interaction.editReply({ embeds: [embed] });

      // Log to admin channel if configured
      if (config.channels.adminlog) {
        const logChannel = interaction.guild.channels.cache.get(config.channels.adminlog);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor("#FFA500")
            .setTitle("Admin Log - SetVIP")
            .addFields(
              { name: "Admin", value: discordUser, inline: true },
              { name: "Player", value: playerName, inline: true },
              { name: "VIP Level", value: `${vipLevel} (${vipRankName})`, inline: true },
              { name: "Duration", value: durationType, inline: true },
              { name: "Expires", value: expirationDate, inline: true }
            )
            .setTimestamp();
          
          logChannel.send({ embeds: [logEmbed] });
        }
      }

    } catch (error) {
      console.error("SetVIP command error:", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Error")
            .setDescription(` **Error:** ${error.message}`) 
        ],
      });
    }
  },
};