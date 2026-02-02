const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const {
  saveReportData,
  getUserReport,
  deleteReportData,
} = require("../../functions/reportHandler");

module.exports = {
  customId: "reportBugModal",
  async execute(interaction) {
    const userId = interaction.user.id;

    // Cek apakah user sudah memiliki laporan aktif
    const existingReport = getUserReport(userId);
    if (existingReport) {
      return interaction.reply({
        content: "❌ You already have an active bug report ticket!",
        ephemeral: true,
      });
    }

    const bugTitle = interaction.fields.getTextInputValue("bugTitle");
    const bugDescription =
      interaction.fields.getTextInputValue("bugDescription");
    const bugEvidence = interaction.fields.getTextInputValue("bugEvidence");

    const channelName = `bug-${bugTitle.replace(/\s+/g, "-").toLowerCase()}`;
    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: 0,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: ["ViewChannel"],
        },
        {
          id: userId,
          allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle(`Bug Report: ${bugTitle}`)
      .setColor("#FF0000")
      .setDescription(bugDescription)
      .addFields({ name: "Evidence", value: bugEvidence })
      .setFooter({ text: `Reported by ${interaction.user.tag}` })
      .setTimestamp();

    const deleteButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("deleteBugTicket")
        .setLabel("Delete Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `Bug report by <@${userId}>`,
      embeds: [embed],
      components: [deleteButton],
    });

    saveReportData(userId, bugTitle, bugDescription, bugEvidence);

    interaction.reply({
      content: `✅ Bug report ticket created successfully: <#${channel.id}>`,
      ephemeral: true,
    });
  },
};
