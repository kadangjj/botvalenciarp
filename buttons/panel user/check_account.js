const { EmbedBuilder } = require("discord.js");
const { pool } = require("../../functions/database");
const { getUserCharacters } = require("../../functions/dataFunction");
const { sendAccountInfo } = require("../../functions/emailService");

module.exports = {
  customId: "check_account",
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const DiscordID = interaction.user.id;
    const [userData] = await pool.execute(
      "SELECT * FROM playerucp WHERE DiscordID = ?",
      [DiscordID]
    );

    if (userData.length === 0) {
      return interaction.editReply({
        content: "Anda belum mendaftar. Silakan daftar terlebih dahulu.",
      });
    }

    const ucpName = userData[0].ucp;
    const verifycode = userData[0].verifycode;
    const email = userData[0].email;

    if (!email) {
      return interaction.editReply({
        content: "Email tidak ditemukan di akun Anda. Silakan update email terlebih dahulu.",
      });
    }

    const characters = await getUserCharacters(ucpName);
    
    // Kirim ke email
    const emailResult = await sendAccountInfo(email, {
      ucpName,
      verifycode,
      characters
    });

    if (!emailResult.success) {
      return interaction.editReply({
        content: `❌ Gagal mengirim email: ${emailResult.error}`,
      });
    }

    const charList = characters.length > 0
      ? characters.map((char, index) => `${index + 1}. ${char}`).join("\n")
      : "Tidak ada karakter.";

    const accountInfo = `
**UCP**: ${ucpName || "Tidak ditemukan"}
**PIN**: ${String(verifycode)}
**EMAIL**: ${String(email)}

**Jumlah Karakter**: ${characters.length} Karakter
**Daftar Karakter**: 
${charList}
    `;

    const embed = new EmbedBuilder()
      .setTitle("✅ Informasi Akun Telah Dikirim!")
      .setColor("#4715A3")
      .setDescription(accountInfo)
      .setFooter({
        text: "User Control Panel - Check Account",
        iconURL: "https://media.discordapp.net/attachments/840871518983421952/1330902542669844530/d1549e9d21e6f585403afa739ff6e62e-VzgQpu0jk-transformed.jpeg?ex=67979415&is=67964295&hm=d220e29c26f15213659e1fb8c17cff24405e2129ee27fd44136359e828183584&format=webp&width=683&height=683&",
      })
      .setTimestamp();

    try {
      // Kirim ke DM
      await interaction.user.send({ embeds: [embed] });
      
      // Reply di channel
      await interaction.editReply({
        content: `✅ Informasi akun telah dikirim ke:\n📧 Email: **${email}**\n💬 DM Discord Anda`,
      });
    } catch (error) {
      console.error("Gagal mengirim DM:", error);
      
      // Jika gagal DM, tetap reply bahwa email terkirim
      await interaction.editReply({
        content: `✅ Informasi akun telah dikirim ke email: **${email}**\n\n⚠️ Gagal mengirim DM. Pastikan Anda mengizinkan pesan dari bot server ini.`,
      });
    }
  },
};