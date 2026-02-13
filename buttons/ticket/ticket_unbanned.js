// ============================================
// FILE: buttons/ticket_unbanned.js
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
  customId: "ticket_unbanned",
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;

    // Check if user already has an open ticket
    const existingTicket = guild.channels.cache.find(
      (ch) =>
        ch.name.startsWith(`unbanned-${member.user.username.toLowerCase()}`) &&
        ch.type === ChannelType.GuildText
    );

    if (existingTicket) {
      return interaction.editReply({
         embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`Anda sudah memiliki ticket UNBANNED yang aktif di ${existingTicket}!`),
        ],
      });
    }

    try {
      const categoryId = config.ticket?.categoryId || null;

      // Create ticket channel
      const ticketChannel = await guild.channels.create({
        name: `unbanned-${member.user.username}`,
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
        .setColor("#5865F2")
        .setTitle("TICKET REQUEST UNBANNED")
        .setDescription(
          `Halo ${member}!\n\n` +
          "Anda membuat permohonan unbanned akun.\n\n" +
          "**Silakan isi informasi berikut:**\n" +
          "• Nama character yang terkena banned\n" +
          "• Alasan banned\n" +
          "• Alasan mengapa harus di-unbanned\n" +
          "• Janji tidak akan mengulangi pelanggaran\n\n" +
          "⚠️ **PENTING** Permohonan unbanned akan dipertimbangkan berdasarkan:\n" +
          "• Jenis pelanggaran\n" +
          "• Riwayat player\n" +
          "• Bukti perubahan sikap\n\n" +
          "Staff akan meninjau permohonan Anda."
        )
        .setTimestamp()
        .setFooter({
          text: "Valencia Roleplay • Unbanned Request",
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
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(`Ticket UNBANNED berhasil dibuat! ${ticketChannel}`),
        ],
      });

      // LOG: Send to log channel
      const logChannel = guild.channels.cache.get(config.ticket.logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("#5865F2")
          .setTitle("TICKET OPENED")
          .setDescription(`**Type:** REQ UNBANNED\n**Channel:** ${ticketChannel}\n**User:** ${member}`)
          .addFields(
            { name: "User ID", value: member.id, inline: true },
            { name: "Channel ID", value: ticketChannel.id, inline: true },
            { name: "Opened At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }

      console.log(`✅ Unbanned ticket created: ${ticketChannel.name} by ${member.user.tag}`);
    } catch (error) {
      console.error("❌ Error creating unbanned ticket:", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription("Terjadi kesalahan saat membuat ticket!"),
        ],
      });
    }
  },
};