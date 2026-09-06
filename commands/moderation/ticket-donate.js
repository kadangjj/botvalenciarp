const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-donate")
    .setDescription("Setup ticket donation panel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel untuk ticket panel")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Akses Ditolak")
            .setDescription("Anda tidak memiliki izin untuk mengakses fitur ini!"),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const channel = interaction.options.getChannel("channel");

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setAuthor({
        name: "Valencia Roleplay",
        iconURL: interaction.guild.iconURL(),
      })
      .setTitle("Donation Center")
      .setDescription(
        "Selamat datang di **Valencia Roleplay Donation Center**!\n\n" +
        "Dukung server kami dengan melakukan donasi dan dapatkan berbagai keuntungan eksklusif.\n\n" +
        "Klik tombol **Donate** di bawah untuk memulai proses donasi.\n" +
        "Admin kami akan segera membantu kamu. 🙏\n\n" +
        "━━━━━━━━━━━━━━━━━━━━━━\n" +
        "📋 Lihat daftar harga donasi\n" +
        "👑 Lihat paket VIP tersedia\n" +
        "💳 Informasi metode pembayaran\n" +
        "━━━━━━━━━━━━━━━━━━━━━━"
      )
      .setThumbnail(interaction.guild.iconURL())
      .setFooter({
        text: "Valencia Roleplay Donation Center",
        iconURL: interaction.guild.iconURL(),
      })
      .setTimestamp();

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

    // Row 2: Open ticket button
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_donate")
        .setLabel("💰 Donate")
        .setStyle(ButtonStyle.Success)
    );

    try {
      await channel.send({
        embeds: [embed],
        components: [row1, row2],
      });

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#00FF00")
            .setTitle("Berhasil")
            .setDescription(`Donation panel berhasil dibuat di ${channel}!`),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Error")
            .setDescription("Gagal membuat donation panel!"),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};