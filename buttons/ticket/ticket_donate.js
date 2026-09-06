const {
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  customId: "ticket_donate",
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guild = interaction.guild;
    const member = interaction.member;

    const existingTicket = guild.channels.cache.find(
      (ch) =>
        ch.name.startsWith(`donate-${member.user.username.toLowerCase()}`) &&
        ch.type === ChannelType.GuildText
    );

    if (existingTicket) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription(`Anda sudah memiliki ticket aktif di ${existingTicket}!`),
        ],
      });
    }

    try {
      const categoryId = config.ticket?.donateCategory || null;

      const ticketChannel = await guild.channels.create({
        name: `donate-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
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

      const welcomeEmbed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle("💰 TICKET DONASI")
        .setDescription(
          `Halo ${member}!\n\n` +
          "Terima kasih telah ingin berdonasi untuk **Valencia Roleplay**!\n\n" +
          "**Silakan isi informasi berikut:**\n" +
          "• Nama Character In-Game\n" +
          "• Paket Donasi yang diinginkan\n" +
          "• Metode pembayaran\n\n" +
          "Gunakan tombol di bawah untuk melihat info donasi.\n" +
          "Staff kami akan segera membantu Anda. 🙏"
        )
        .setTimestamp()
        .setFooter({
          text: "Valencia Roleplay • Donation System",
          iconURL: guild.iconURL(),
        });

      // Row 1: Info buttons
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("donate_list")
          .setLabel("📋 Donation List")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("donate_vip")
          .setLabel("👑 VIP Info")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("donate_payment")
          .setLabel("💳 Payment")
          .setStyle(ButtonStyle.Secondary)
      );

      // Row 2: Close button
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Close Ticket")
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({
        content: `${member} <@&${config.roles.FounderRole}>`,
        embeds: [welcomeEmbed],
        components: [row1, row2],
      });

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff00)
            .setDescription(`Ticket donasi berhasil dibuat! ${ticketChannel}`),
        ],
      });

      // Log channel
      const logChannel = guild.channels.cache.get(config.ticket.logChannelId);
      if (logChannel) {
        await logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#FFD700")
              .setTitle("TICKET OPENED")
              .setDescription(
                `**Type:** DONATE\n**Channel:** ${ticketChannel}\n**User:** ${member}`
              )
              .addFields(
                { name: "User ID", value: member.id, inline: true },
                { name: "Channel ID", value: ticketChannel.id, inline: true },
                {
                  name: "Opened At",
                  value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
                  inline: false,
                }
              )
              .setThumbnail(member.user.displayAvatarURL())
              .setTimestamp(),
          ],
        });
      }

    } catch (error) {
      console.error("❌ Error creating donate ticket:", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription("Terjadi kesalahan saat membuat ticket!"),
        ],
      });
    }
  },
};