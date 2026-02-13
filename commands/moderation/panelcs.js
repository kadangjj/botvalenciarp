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
      .setAuthor({
        name: "Valencia Roleplay",
        iconURL: "https://cdn.discordapp.com/attachments/1330494882778845301/1443922699033514034/20251128_181111.jpg?ex=692ad54e&is=692983ce&hm=53bb27e9c56bcb51e1fcf74d246d3f9aab58bd59f86902c557608c63df55284f&"
      })
      .setDescription(
        "## Character Story Panel\n\n" +
        "Buat latar belakang karakter Anda dengan mengikuti panduan yang telah ditentukan.\n\n" +
        "---\n\n" +
        "### 📋 **Syarat Character Story**\n\n" +
        "• **Level minimal 3**\n" +
        "• Minimal **200 kata** dan **3 paragraf**\n" +
        "• Menggunakan **bahasa formal (EYD)**\n" +
        "• Sudut pandang **orang ketiga**\n" +
        "• Tidak mengandung **OOC/nama terkenal**\n" +
        "• **Realistis** sesuai roleplay GTA SAMP\n\n" +
        "\n\n" +
        "### ⚠️ **Penting**\n\n" +
        "• Pastikan nama karakter yang diinput **benar dan milik Anda**\n" +
        "• Story akan **divalidasi otomatis** oleh sistem\n" +
        "• Jika ditolak, Anda bisa **mengajukan ulang**\n\n" 
          )
      .setColor("#5865F2")
      .setFooter({
        text: "Character story Anda otomatis divalidasi oleh sistem Valencia Roleplay",
        iconURL: "https://cdn.discordapp.com/attachments/1330494882778845301/1443922699033514034/20251128_181111.jpg?ex=692ad54e&is=692983ce&hm=53bb27e9c56bcb51e1fcf74d246d3f9aab58bd59f86902c557608c63df55284f&",
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