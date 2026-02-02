// ============================================
// FILE: buttons/ticket_report.js
// ============================================
const {
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const config = require("../../config.json"); // FIXED: Naik 2 level dari buttons/ticket/

module.exports = {
  customId: "ticket_report",
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;

    // Check if user already has an open ticket
    const existingTicket = guild.channels.cache.find(
      (ch) =>
        ch.name.startsWith(`report-${member.user.username.toLowerCase()}`) &&
        ch.type === ChannelType.GuildText
    );

    if (existingTicket) {
      return interaction.editReply({
        content: `❌ Anda sudah memiliki ticket REPORT yang aktif di ${existingTicket}!`,
      });
    }

    try {
      const categoryId = config.ticket?.categoryId || null;

      // Create ticket channel
      const ticketChannel = await guild.channels.create({
        name: `report-${member.user.username}`,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          {
            id: config.roles.adminRole,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      // Welcome embed
      const welcomeEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("🚨 TICKET REPORT PLAYER")
        .setDescription(
          `Halo ${member}!\n\n` +
          "Terima kasih telah membuat laporan.\n\n" +
          "**Silakan isi informasi berikut dengan lengkap:**\n" +
          "• Nama player yang dilaporkan\n" +
          "• Jenis pelanggaran\n" +
          "• Bukti (screenshot/video)\n" +
          "• Waktu kejadian\n" +
          "• Deskripsi detail kejadian\n\n" +
          "Staff kami akan segera menindaklanjuti laporan Anda."
        )
        .setTimestamp()
        .setFooter({
          text: "Valencia Roleplay • Report System",
          iconURL: guild.iconURL(),
        });

      const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Close Ticket")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({
        content: `${member} <@&${config.roles.serversupport}>`,
        embeds: [welcomeEmbed],
        components: [row],
      });

      await interaction.editReply({
        content: `✅ Ticket REPORT berhasil dibuat! ${ticketChannel}`,
      });

      // LOG: Send to log channel
      const logChannel = guild.channels.cache.get(config.ticket.logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("📂 TICKET OPENED")
          .setDescription(`**Type:** REPORT\n**Channel:** ${ticketChannel}\n**User:** ${member}`)
          .addFields(
            { name: "User ID", value: member.id, inline: true },
            { name: "Channel ID", value: ticketChannel.id, inline: true },
            { name: "Opened At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }

      console.log(`✅ Report ticket created: ${ticketChannel.name} by ${member.user.tag}`);
    } catch (error) {
      console.error("❌ Error creating report ticket:", error);
      await interaction.editReply({
        content: "❌ Terjadi kesalahan saat membuat ticket!",
      });
    }
  },
};