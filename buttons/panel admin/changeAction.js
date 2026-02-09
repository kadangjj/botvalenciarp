const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  customId: "changeAction",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Akses Ditolak")
            .setDescription("Anda tidak memiliki izin untuk mengakses fitur ini!")
        ],
        ephemeral: true,
      });
    }
    const embed = new EmbedBuilder()
      .setTitle("Change Data")
      .setDescription(
        "Pilih data yang ingin diubah:\n- **UCP** untuk mengganti nama akun.\n- **Character** untuk mengganti nama karakter."
      )
      .setColor("#0D6EFD")
      .setTimestamp();

    const dropdown = new StringSelectMenuBuilder()
      .setCustomId("changeDropdown")
      .setPlaceholder("Pilih data yang ingin diubah")
      .addOptions([
        {
          label: "UCP",
          description: "Ganti nama akun UCP.",
          value: "changeUCP",
        },
        {
          label: "Character",
          description: "Ganti nama karakter.",
          value: "changeCharacter",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(dropdown);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });
  },
};
