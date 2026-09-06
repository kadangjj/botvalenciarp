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
    .setName("panelssrp")
    .setDescription("Panel untuk membuat screenshot SSRP otomatis"),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Akses Ditolak")
            .setDescription("Anda tidak memiliki izin untuk mengakses fitur ini!"),
        ],
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Valencia Roleplay",
        iconURL: "https://cdn.discordapp.com/attachments/1330494882778845301/1443922699033514034/20251128_181111.jpg",
      })
      .setDescription(
        "## SSRP Generator\n\n" +
        "Buat screenshot SSRP otomatis dengan overlay teks kustom.\n\n" +
        "---\n\n" +
        "### 📋 **Cara Penggunaan**\n\n" +
        "1. Klik tombol **Create SSRP Screenshot** di bawah\n" +
        "2. Upload **gambar polos** (screenshot GTA SAMP tanpa teks)\n" +
        "3. Isi teks yang ingin ditampilkan:\n" +
        "   - **Narasi** (teks kuning miring `* ...`)\n" +
        "   - **Dialog** (teks putih `Nama says: ...`)\n" +
        "   - **Nametag** (teks di atas karakter)\n" +
        "4. Pilih **posisi teks** (atas atau bawah)\n" +
        "5. Screenshot otomatis akan digenerate!\n\n" +
        "### ⚠️ **Format Teks**\n\n" +
        "• Narasi: `* Teks narasi di sini`\n" +
        "• Dialog: `Nama_Karakter says: Teks dialog`\n" +
        "• Nametag: `Nama_Karakter (ID)`\n"
      )
      .setColor("#5865F2")
      .setFooter({
        text: "Valencia Roleplay - SSRP Screenshot Generator",
        iconURL: "https://cdn.discordapp.com/attachments/1330494882778845301/1443922699033514034/20251128_181111.jpg",
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_ssrp_screenshot")
        .setLabel("🖼️ Create SSRP Screenshot")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};