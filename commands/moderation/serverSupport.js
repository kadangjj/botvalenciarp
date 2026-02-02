const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Displays the support panel for players"),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    const embed = new EmbedBuilder()
      .setTitle("Valencia Support Panel")
      .setDescription(
        "**InGame Supports**\n" +
          "Harap Gunakan Official Ticket Tool ini dengan sebaik baiknya."
      )
      .setColor("#0D6EFD")
      .addFields({
          name: "Important Notes",  // TAMBAHKAN INI
          value:
            "**🗑 Ucp Delete:**\n[-] Harap Konfirmasikan kembali bahwa ketika ucp sudah di delete, tidak dapat di Recover kembali.\n\n" +
            "**🗑 Character Delete:**\n[-] Harap Konfirmasikan kembali bahwa ketika Character sudah di delete, tidak dapat di Recover kembali.\n\n" +
            "**📖 Character Story**\n[-] Buat Character story character anda dengan benar\n[-] Masukkan nama character yang akan didaftarkan character story.",
          inline: false,
      })
      .setFooter({
        text: "Valencia Roleplay - Still High",
        iconURL:
          "https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg?ex=692bc8a4&is=692a7724&hm=845e78348ccf3761a0aac224cf4061752c697f93d5d61b0f3f197ca11b4f859d&",
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("UcpDelete")
        .setLabel("🗑 Ucp Delete")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("CharacterDetele")
        .setLabel("🗑 Character Delete")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("character_story")
        .setLabel("📖 Character Story")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
