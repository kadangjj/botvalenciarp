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
    .setName("paneluser")
    .setDescription("Displays the UCP panel for players"),
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
      .setTitle("🚀 Valencia Roleplay")
      .setDescription(
        "## 🚀 User Control Panel Valencia Roleplay\n\n" +
        "Selamat datang di User Control Panel (UCP) Valencia Roleplay.\n" +
        "Panel ini dirancang untuk membantu Anda mengelola akun dan karakter dengan mudah.\n\n" +
        "Gunakan tombol di bawah untuk mengakses fitur yang tersedia.\n\n" +
        "---\n\n" +
        "### 📝 **REGISTER**\n" +
        "Fitur ini memungkinkan Anda untuk membuat akun baru di User Control Panel (UCP). Proses registrasi akan memastikan bahwa akun Anda aman dan siap digunakan untuk mengakses berbagai layanan terkait.\n\n" +
        "---\n\n" +
        "### 🔍 **CHECK ACCOUNT**\n" +
        "Gunakan fitur ini untuk memeriksa informasi lengkap terkait akun UCP Anda, termasuk detail email, status akun, dan data lainnya.\n\n" +
        "---\n\n" +
        "### 📋 **INFO CHARACTER**\n" +
        "Fitur ini memberikan akses untuk melihat detail lengkap mengenai karakter yang terhubung dengan akun Anda, seperti nama, level, pekerjaan, dan status dalam permainan.\n\n" +
        "---\n\n" +
        "### 🔒 **CHANGE PASSWORD**\n" +
        "Ketika Anda lupa kata sandi atau ingin memperbarui keamanan akun, fitur ini memungkinkan Anda untuk mengganti kata sandi dengan mudah dan aman.\n\n" +
        "---\n\n" +
        "### 🔄 **REVERIF**\n" +
        "Untuk mendapatkan role Verified, jika kamu tidak sengaja keluar dari server dan ingin kembali.\n\n" +
        "---\n\n" +
        "### ⚠️ **Penting**\n" +
        "• Jaga kerahasiaan informasi akun Anda.\n" +
        "• Jika ada masalah, hubungi Tim Administrator."
      )
      .setColor("#5865F2")
      .setFooter({
        text: "Valencia Roleplay • Still High",
        iconURL:
          "https://cdn.discordapp.com/attachments/1330494882778845301/1443922699033514034/20251128_181111.jpg?ex=692ad54e&is=692983ce&hm=53bb27e9c56bcb51e1fcf74d246d3f9aab58bd59f86902c557608c63df55284f&",
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("register")
        .setLabel("📝 Register")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("reverify")
        .setLabel("🔄 Reverif")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("check_account")
        .setLabel("🔍 Check Account")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("info_character")
        .setLabel("📋 Info Character")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("change_password")
        .setLabel("🔒 Change Password")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};