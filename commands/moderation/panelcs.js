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
    .setName("panelcs")
    .setDescription("Displays the character story panel for players"),
  async execute(interaction) {
    // Cek role admin
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
      .setTitle("📖 Character Story Panel")
      .setDescription(
        "**Character Story Registration**\n" +
        "Buat latar belakang karakter Anda dengan mengikuti panduan yang telah ditentukan."
      )
      .setColor("#0D6EFD")
      .addFields({
        name: "Syarat Character Story",
        value:
          "• **Level minimal 3**\n" +
          "• Minimal **200 kata** dan **3 paragraf**\n" +
          "• Menggunakan **bahasa formal (EYD)**\n" +
          "• Sudut pandang **orang ketiga**\n" +
          "• Tidak mengandung **OOC/nama terkenal**\n" +
          "• **Realistis** sesuai roleplay GTA SAMP",
        inline: false,
      })
      .addFields({
        name: "Penting",
        value:
          "• Pastikan nama karakter yang diinput **benar dan milik Anda**\n" +
          "• Story akan **divalidasi otomatis** oleh sistem\n" +
          "• Jika ditolak, Anda bisa **mengajukan ulang**",
        inline: false,
      })
      .setFooter({
        text: "Character story anda otomatis divalidasi oleh sistem | Valencia Roleplay - Still High",
        iconURL:
          "https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg?ex=692bc8a4&is=692a7724&hm=845e78348ccf3761a0aac224cf4061752c697f93d5d61b0f3f197ca11b4f859d&",
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("character_story")
        .setLabel("📖 Create Character Story")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};