const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  InteractionType,
  EmbedBuilder
} = require("discord.js");
const { pool } = require("../../functions/database");
const { sendVerificationCode } = require("../../functions/emailService");

module.exports = {
  customId: "change_password",
  async execute(interaction) {
    try {
      // Pastikan interaction adalah Button
      if (interaction.type !== InteractionType.MessageComponent) return;

      // ═══════════════════════════════════════════════════════════
      // LANGKAH 1: SHOW MODAL DULU (SEBELUM 3 DETIK!)
      // ═══════════════════════════════════════════════════════════
      const modal = new ModalBuilder()
        .setCustomId("change_password_modal")
        .setTitle("Change Password");

      const codeInput = new TextInputBuilder()
        .setCustomId("verification_code")
        .setLabel("Kode Verifikasi (Cek Email Anda)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("6 digit kode verifikasi")
        .setMinLength(6)
        .setMaxLength(6)
        .setRequired(true);

      const passwordInput = new TextInputBuilder()
        .setCustomId("new_password")
        .setLabel("Masukkan Kata Sandi Baru")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Kata sandi baru Anda")
        .setMinLength(6)
        .setMaxLength(32)
        .setRequired(true);

      const confirmPasswordInput = new TextInputBuilder()
        .setCustomId("confirm_password")
        .setLabel("Konfirmasi Kata Sandi Baru")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Ketik ulang kata sandi baru")
        .setMinLength(6)
        .setMaxLength(32)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(codeInput),
        new ActionRowBuilder().addComponents(passwordInput),
        new ActionRowBuilder().addComponents(confirmPasswordInput)
      );

      // SHOW MODAL LANGSUNG (ini merespons interaction)
      await interaction.showModal(modal);

      // ═══════════════════════════════════════════════════════════
      // LANGKAH 2: KIRIM EMAIL DI BACKGROUND (SETELAH MODAL MUNCUL)
      // ═══════════════════════════════════════════════════════════
      const DiscordID = interaction.user.id;

      const [userRows] = await pool.query(
        "SELECT * FROM playerucp WHERE DiscordID = ?",
        [DiscordID]
      );

      if (userRows.length === 0) {
        console.error(`User dengan DiscordID ${DiscordID} tidak ditemukan di database`);
        return; // Modal sudah ditampilkan, tidak bisa reply lagi
      }

      const userData = userRows[0];
      const email = userData.email;

      if (!email) {
        console.error(`Email tidak ditemukan untuk DiscordID ${DiscordID}`);
        return;
      }

      // Generate 6 digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 300000; // 5 menit

      // Simpan kode di DB
      await pool.query(
        "UPDATE playerucp SET temp_verification_code = ?, temp_code_expires = ? WHERE DiscordID = ?",
        [verificationCode, expiresAt, DiscordID]
      );

      // Kirim email
      const emailResult = await sendVerificationCode(email, {
        ucpName: userData.ucp,
        verificationCode
      });

      if (!emailResult.success) {
        console.error(`Gagal mengirim email ke ${email}: ${emailResult.error}`);
      } else {
        const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
        console.log(`Verification code sent: ${maskedEmail}`);
      }

    } catch (error) {
      console.error("Error in change_password button:", error);

      // Jika modal belum ditampilkan, baru reply error
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription("Terjadi kesalahan. Silakan coba lagi."),
          ],
          flags: 64,
        }).catch(() => {}); // Ignore jika sudah replied
      }
    }
  },
};