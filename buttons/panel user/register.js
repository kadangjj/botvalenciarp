const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  customId: "register",
  async execute(interaction) {
    // Membuat modal baru
    const modal = new ModalBuilder()
      .setCustomId("register_modal")
      .setTitle("REGISTER USER CONTROL PANEL");

    // Input untuk UCP Name
    const ucpName = new TextInputBuilder()
      .setCustomId("ucp")
      .setLabel("INPUT YOUR UCP NAME")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("your UCP name")
      .setMaxLength(10);

    // Input untuk Email
    const emailInput = new TextInputBuilder()
      .setCustomId("email")
      .setLabel("INPUT YOUR EMAIL")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("example@example.com");

    // Menambahkan input ke action row
    const actionRow1 = new ActionRowBuilder().addComponents(ucpName);
    const actionRow2 = new ActionRowBuilder().addComponents(emailInput);

    // Menambahkan action rows ke modal
    modal.addComponents(actionRow1, actionRow2);

    // Menampilkan modal
    await interaction.showModal(modal);
  },
};
