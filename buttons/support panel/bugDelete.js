const { deleteReportData } = require("../../functions/reportHandler");

module.exports = {
  customId: "deleteBugTicket",
  async execute(interaction) {
    await interaction.reply({
      content: "✅ Bug report ticket deleted successfully!",
      ephemeral: true,
    });

    const channel = interaction.channel;
    const userId = interaction.user.id;

    deleteReportData(userId);

    await channel.delete().catch((error) => {
      console.error("Failed to delete channel:", error);
    });
  },
};
