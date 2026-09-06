const { EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
  customId: "donate_list",
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("DONATION LIST")
      .addFields(
        {
          name: "Benefit Pribadi",
          value:
            "> Level +1 — **Rp 10.000**\n" +
            "> Change Name — **Rp 25.000**",
        },
        {
          name: "Gold",
          value:
            "> 500 Gold — **Rp 50.000**\n" +
            "> 1000 Gold — **Rp 100.000**\n" +
            "> 3000 Gold — **Rp 200.000**",
        },
        {
          name: "Import Vehicle",
          value:
            "> Darat — **Rp 50.000**\n" +
            "> Laut — **Rp 40.000**\n" +
            "> Udara — **Rp 70.000**",
        },
        {
          name: "Property",
          value:
            "> Private Gate (Pagar) — **Rp 30.000**\n" +
            "> Workshop (Free Mapping 7 Object) — **Rp 50.000**\n" +
            "> Private Farm — **Rp 50.000**",
        },
        {
          name: "Business",
          value:
            "> 24/7 Market — **Rp 40.000**\n" +
            "> Equipment — **Rp 30.000**\n" +
            "> Electronic / Clothes — **Rp 25.000**\n" +
            "> Fast Food — **Rp 30.000**",
        },
        {
          name: "House",
          value:
            "> Very Small — **Rp 10.000**\n" +
            "> Small — **Rp 20.000**\n" +
            "> Medium — **Rp 40.000**\n" +
            "> Large — **Rp 60.000**",
        },
        {
          name: "Note",
          value:
            "*House, Business, Workshop dan Private Farm bebas pilih lokasi.*\n" +
            "Info pembayaran & ketentuan: <#1330494883382956099>",
        }
      )
      .setFooter({ text: "Valencia Roleplay — Donation List" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};