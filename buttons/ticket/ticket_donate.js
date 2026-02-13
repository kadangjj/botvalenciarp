// ============================================
// FILE: buttons/ticket_donate.js
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
  customId: "ticket_donate",
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;

    // Check if user already has an open ticket
    const existingTicket = guild.channels.cache.find(
      (ch) =>
        ch.name.startsWith(`donate-${member.user.username.toLowerCase()}`) &&
        ch.type === ChannelType.GuildText
    );

    if (existingTicket) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(`Anda sudah memiliki ticket DONATE yang aktif di ${existingTicket}!`),
        ],
      });
    }

    try {
      const categoryId = config.ticket?.categoryId || null;

      // Create ticket channel
      const ticketChannel = await guild.channels.create({
        name: `donate-${member.user.username}`,
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
        .setColor("#00FF00")
        .setTitle("💰 TICKET DONASI")
        .setDescription(
          `Halo ${member}!\n\n` +
          "Terima kasih telah ingin berdonasi untuk Valencia Roleplay!\n\n" +
          "**Silakan isi informasi berikut:**\n" +
          "• Nama Character In-Game\n" +
          "• Paket Donasi yang diinginkan\n" +
          "• Metode pembayaran\n\n" +
          "Staff kami akan segera membantu Anda."
        )
        .setTimestamp()
        .setFooter({
          text: "Valencia Roleplay • Donation System",
          iconURL: guild.iconURL(),
        });

      const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Close Ticket")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({
        content: `${member} <@&${config.roles.adminRole}>`,
        embeds: [welcomeEmbed],
        components: [row],
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(`Ticket DONATE berhasil dibuat! ${ticketChannel}`),
        ],
      });

      // LOG: Send to log channel
      const logChannel = guild.channels.cache.get(config.ticket.logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("TICKET OPENED")
          .setDescription(`**Type:** DONATE\n**Channel:** ${ticketChannel}\n**User:** ${member}`)
          .addFields(
            { name: "User ID", value: member.id, inline: true },
            { name: "Channel ID", value: ticketChannel.id, inline: true },
            { name: "Opened At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }

      console.log(`✅ Donate ticket created: ${ticketChannel.name} by ${member.user.tag}`);
    } catch (error) {
      console.error("❌ Error creating donate ticket:", error);
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