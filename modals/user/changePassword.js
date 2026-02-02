const crypto = require("crypto");
const { pool } = require("../../functions/database");

module.exports = {
  customId: "change_password_modal",
  
  // ===== Modal Discord: ganti password dengan verifikasi =====
  async execute(interaction) {
    try {
      const DiscordID = interaction.user.id;
      const verificationCode = interaction.fields.getTextInputValue("verification_code");
      const newPassword = interaction.fields.getTextInputValue("new_password");
      const confirmPassword = interaction.fields.getTextInputValue("confirm_password");

      // ===== Get user data =====
      const [userRows] = await pool.query(
        "SELECT * FROM playerucp WHERE DiscordID = ?",
        [DiscordID]
      );

      if (userRows.length === 0) {
        return interaction.reply({
          content: "❌ User tidak ditemukan!",
          ephemeral: true,
        });
      }

      const userData = userRows[0];

      // ===== Check if verification code exists =====
      if (!userData.temp_verification_code || !userData.temp_code_expires) {
        return interaction.reply({
          content: "❌ Kode verifikasi tidak ditemukan. Silakan request ulang.",
          ephemeral: true,
        });
      }

      // ===== Check if code is expired (5 minutes) =====
      if (Date.now() > userData.temp_code_expires) {
        await pool.query(
          "UPDATE playerucp SET temp_verification_code = NULL, temp_code_expires = NULL WHERE DiscordID = ?",
          [DiscordID]
        );
        return interaction.reply({
          content: "❌ Kode verifikasi telah kadaluarsa. Silakan request ulang.",
          ephemeral: true,
        });
      }

      // ===== Verify code =====
      if (verificationCode !== userData.temp_verification_code) {
        return interaction.reply({
          content: "❌ Kode verifikasi salah!",
          ephemeral: true,
        });
      }

      // ===== Check if passwords match =====
      if (newPassword !== confirmPassword) {
        return interaction.reply({
          content: "❌ Password dan konfirmasi password tidak cocok!",
          ephemeral: true,
        });
      }

      // ===== Password validation =====
      if (newPassword.length < 6) {
        return interaction.reply({
          content: "❌ Password minimal 6 karakter!",
          ephemeral: true,
        });
      }

      if (newPassword.length > 32) {
        return interaction.reply({
          content: "❌ Password maksimal 32 karakter!",
          ephemeral: true,
        });
      }

      // ===== Generate salt baru (16 karakter random) =====
      let salt = "";
      for (let i = 0; i < 16; i++) {
        salt += String.fromCharCode(Math.floor(Math.random() * 94) + 33);
      }

      // ===== Hash menggunakan SHA256: password + salt (concat string) =====
      const combinedString = newPassword + salt;
      const hash = crypto
        .createHash("sha256")
        .update(combinedString, "utf8")
        .digest("hex")
        .toUpperCase(); // UPPERCASE seperti PAWN

      // ===== Update DB dan clear verification code =====
      await pool.query(
        "UPDATE playerucp SET password = ?, salt = ?, temp_verification_code = NULL, temp_code_expires = NULL WHERE DiscordID = ?",
        [hash, salt, DiscordID]
      );

      await interaction.reply({
        content: "✅ Password berhasil diubah! Anda dapat login dengan password baru.",
        ephemeral: true,
      });

      // ===== Log aktivitas (optional) =====
      console.log(`✅ Password changed for UCP: ${userData.ucp} (Discord: ${DiscordID})`);

    } catch (err) {
      console.error("Error changing password:", err);
      await interaction.reply({
        content: "❌ Terjadi kesalahan saat memperbarui kata sandi.",
        ephemeral: true,
      });
    }
  },

  // ===== Fungsi login kompatibel dengan PAWN =====
  async validatePassword(DiscordID, inputPassword) {
    try {
      const [rows] = await pool.query(
        "SELECT password, salt FROM playerucp WHERE DiscordID = ?",
        [DiscordID]
      );
      
      if (rows.length === 0) return false;
      
      const { password: storedHash, salt } = rows[0];
      
      // Hash input password + salt (concat string seperti PAWN)
      const combinedString = inputPassword + salt;
      const inputHash = crypto
        .createHash("sha256")
        .update(combinedString, "utf8")
        .digest("hex")
        .toUpperCase(); // UPPERCASE seperti PAWN
      
      return inputHash === storedHash;
    } catch (error) {
      console.error("Error validating password:", error);
      return false;
    }
  },
};