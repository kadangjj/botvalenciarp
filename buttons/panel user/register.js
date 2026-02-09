const { 
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} = require("discord.js");

const {
  isUserRegistered,
} = require("../../functions/register");

const config = require("../../config");
const roleCitizen = config.roles.roleCitizen;

module.exports = {
  customId: "register",
  async execute(interaction) {
    const discordId = interaction.user.id;
    
    // Cek apakah user sudah terdaftar
    if (await isUserRegistered(discordId)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Registrasi Gagal")
            .setDescription("Kamu sudah memiliki UCP yang terdaftar.")
        ],
        ephemeral: true
      });
    }
    
    // Membuat modal baru
    const modal = new ModalBuilder()
      .setCustomId("register_modal")
      .setTitle("REGISTER USER CONTROL PANEL");

    const ucpName = new TextInputBuilder()
      .setCustomId("ucp")
      .setLabel("INPUT YOUR UCP NAME")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("your UCP name")
      .setMaxLength(10);

    const emailInput = new TextInputBuilder()
      .setCustomId("email")
      .setLabel("INPUT YOUR EMAIL")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("example@example.com");

    const actionRow1 = new ActionRowBuilder().addComponents(ucpName);
    const actionRow2 = new ActionRowBuilder().addComponents(emailInput);

    modal.addComponents(actionRow1, actionRow2);

    await interaction.showModal(modal);
  },
};