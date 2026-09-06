const { EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
  customId: "donate_vip",
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#9B59B6")
      .setTitle("VIP Premium")
      .setDescription("Looking for bonus features and commands? Get premium status today!")
      .addFields(
        {
          name: "🥉 VIP Bronze (1) — Rp 30.000/bulan",
          value:
            "> Gratis 20 Gold\n" +
            "> Mendapat 2 slot job\n" +
            "> Akses custom VIP room dan VIP locker\n" +
            "> 4 slot kendaraan pribadi\n" +
            "> 2 slot rumah\n" +
            "> 2 slot bisnis\n" +
            "> Waktu Paycheck 5% lebih cepat\n" +
            "> Bunga bank 10% setiap paycheck",
        },
        {
          name: "🥈 VIP Silver (2) — Rp 50.000/bulan",
          value:
            "> Gratis 30 Gold\n" +
            "> Mendapat 2 slot job\n" +
            "> Akses custom VIP room dan VIP locker\n" +
            "> 5 slot kendaraan pribadi\n" +
            "> 3 slot rumah\n" +
            "> 3 slot bisnis\n" +
            "> Waktu Paycheck 10% lebih cepat\n" +
            "> Bunga bank 15% setiap paycheck",
        },
        {
          name: "💎 VIP Diamond (3) — Rp 80.000/bulan",
          value:
            "> Gratis 40 Gold\n" +
            "> Mendapat 2 slot job\n" +
            "> Akses custom VIP room dan VIP locker\n" +
            "> 6 slot kendaraan pribadi\n" +
            "> 4 slot rumah\n" +
            "> 4 slot bisnis\n" +
            "> Waktu Paycheck 15% lebih cepat\n" +
            "> Bunga bank 20% setiap paycheck",
        }
      )
      .setFooter({ text: "Valencia Roleplay — VIP Info" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};