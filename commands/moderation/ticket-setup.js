// ============================================
// FILE: commands/admin/ticket-setup.js
// ============================================
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("Setup ticket system panel dengan pilihan button")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel untuk ticket panel")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("donate")
        .setDescription("Tampilkan button DONATE")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("report")
        .setDescription("Tampilkan button REPORT")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("unbanned")
        .setDescription("Tampilkan button REQ UNBANNED")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Check admin role
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel("channel");
    const showDonate = interaction.options.getBoolean("donate") ?? true;
    const showReport = interaction.options.getBoolean("report") ?? true;
    const showUnbanned = interaction.options.getBoolean("unbanned") ?? true;

    // Check if at least one button is enabled
    if (!showDonate && !showReport && !showUnbanned) {
      return interaction.reply({
        content: "❌ Minimal satu button harus diaktifkan!",
        ephemeral: true,
      });
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("Valencia Roleplay")
      .setDescription(
        "**Valencia Support Ticket**\n\n" +
        "Gunakan tiket sesuai fungsinya. Penyalahgunaan tiket tidak akan ditoleransi.\n\n" +
       	(showDonate ? "• **Donasi** — Pengajuan donasi.\n" : "") +
        (showReport ? "• **Report Player** — Pelaporan pelanggaran pemain.\n" : "") +
        (showUnbanned ? "• **Unban Request** — Permohonan peninjauan banned.\n" : "")

      )
      .setFooter({
        text: "Powered by valenciasamp.id",
        iconURL: interaction.guild.iconURL(),
      });

    // Create buttons dynamically
    const buttons = [];

    if (showDonate) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId("ticket_donate")
          .setLabel("💰 Donate")
          .setStyle(ButtonStyle.Success)
      );
    }

    if (showReport) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId("ticket_report")
          .setLabel("🚨 Report")
          .setStyle(ButtonStyle.Danger)
      );
    }

    if (showUnbanned) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId("ticket_unbanned")
          .setLabel("🚩 Request Unbanned")
          .setStyle(ButtonStyle.Primary)
      );
    }

    const row = new ActionRowBuilder().addComponents(buttons);

    try {
      // Send to channel
      await channel.send({
        embeds: [embed],
        components: [row],
      });

      const enabledButtons = [];
      if (showDonate) enabledButtons.push("DONATE");
      if (showReport) enabledButtons.push("REPORT");
      if (showUnbanned) enabledButtons.push("UNBANNED");

      await interaction.reply({
        content: `✅ Ticket panel berhasil dibuat di ${channel}\n📌 Button aktif: ${enabledButtons.join(", ")}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "❌ Gagal membuat ticket panel!",
        ephemeral: true,
      });
    }
  },
};