const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("paneladmin")
    .setDescription(
      "Panel Admin untuk melihat informasi, menghapus, atau mengganti data."
    ),
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
      .setTitle("🔧 Admin Panel")
      .setDescription("Selamat datang di **Panel Admin**! Pilih menu yang diinginkan:")
      .setColor("#0D6EFD")
      .addFields({
        name: "Important Notes",
        value:
          "**📊 Character Info:**\n[-] Lihat detail informasi karakter\n\n" +
          "**👤 UCP Info:**\n[-] Lihat semua karakter milik UCP\n\n" +
          "**🗑️ Delete Data:**\n[-] Hapus UCP atau karakter *PERHATIAN: Tidak dapat dibatalkan!*\n\n" +
          "**✏️ Change Data**\n[-] Ganti nama UCP/karakter",
        inline: false,
      })
      .setFooter({ text: "Panel Admin - Kelola data dengan mudah dan aman." })
      .setTimestamp();

    const infoCharacterButton = new ButtonBuilder()
      .setCustomId("infoCharacter")
      .setLabel("Character Info")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("📊");

    const infoUCPButton = new ButtonBuilder()
      .setCustomId("infoUCP")
      .setLabel("UCP Info")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("👤");

    const deleteButton = new ButtonBuilder()
      .setCustomId("deleteAction")
      .setLabel("Delete Data")
      .setStyle(ButtonStyle.Danger)
      .setEmoji("🗑️");

    const changeButton = new ButtonBuilder()
      .setCustomId("changeAction")
      .setLabel("Change Data")
      .setStyle(ButtonStyle.Success)
      .setEmoji("✏️");

    const row = new ActionRowBuilder().addComponents(
      infoCharacterButton,
      infoUCPButton,
      deleteButton,
      changeButton
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};