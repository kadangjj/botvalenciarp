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
        content: "❌ Anda tidak memiliki izin!",
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
            "**🗑️ Delete Data:**\n[-] Hapus UCP atau karakter *PERHATIAN: Tidak dapat dibatalkan!*\n\n" +
            "**✏️ Change Data**\n[-] Ganti nama UCP/karakter",
          inline: false,
      })
      .setColor("#0D6EFD")
      .setFooter({ text: "Panel Admin - Kelola data dengan mudah dan aman." })
      .setTimestamp();

    const infoButton = new ButtonBuilder()
      .setCustomId("infoCharacter")
      .setLabel("Character Info")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("📊");

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
      infoButton,
      deleteButton,
      changeButton
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
