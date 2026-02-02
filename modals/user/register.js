const { EmbedBuilder } = require("discord.js");
const {
  generatePin,
  insertUser,
  isUserRegistered,
} = require("../../functions/register");
const config = require("../../config");
const roleCitizen = config.roles.roleCitizen;

module.exports = {
  customId: "register_modal",
  async execute(interaction) {
    try {
      // ✅ DEFER SEGERA untuk prevent timeout
      await interaction.deferReply({ flags: 64 }); // ephemeral

      const ucpName = interaction.fields.getTextInputValue("ucp");
      const email = interaction.fields.getTextInputValue("email");
      const DiscordID = interaction.user.id;

      // Validasi Email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      if (!emailRegex.test(email)) {
        return interaction.editReply({
          content: "❌ **Email tidak valid!** Mohon masukkan email yang benar.\nContoh: `user@example.com`",
        });
      }

      // Cek apakah user sudah terdaftar
      if (await isUserRegistered(DiscordID)) {
        return interaction.editReply({
          content: "❌ Anda sudah pernah mendaftar.",
        });
      }

      const verifycode = generatePin();
      const success = await insertUser(ucpName, DiscordID, verifycode, email);
      
      if (success) {
        const embed = new EmbedBuilder()
          .setColor("#4715A3")
          .setTitle("Account Successfully Registered!")
          .setDescription(
            "Selamat! Anda telah berhasil mendaftar akun UCP. Berikut adalah detail akun Anda:\n\n"
          )
          .addFields(
            { 
              name: "👤 UCP Name", 
              value: `> \`${ucpName}\``, 
              inline: true 
            },
            { 
              name: "📧 Email", 
              value: `> \`${email}\``, 
              inline: true 
            },
            { 
              name: "🔐 PIN Code", 
              value: `> \`${verifycode}\``, 
              inline: false 
            },
            {
              name: "⚠️ Catatan Penting",
              value: "```diff\n+ Simpan informasi ini dengan baik\n- Jangan bagikan PIN kepada siapapun\n- Termasuk Tim Administrator!\n```",
              inline: false
            },
            {
              name: "📌 Langkah Selanjutnya",
              value: "• Login ke UCP menggunakan kredensial di atas\n• Verifikasi email Anda jika diperlukan\n• Mulai petualangan Anda di server!",
              inline: false
            }
          )
          .setThumbnail("https://cdn.discordapp.com/attachments/1330494882778845301/1443922699033514034/20251128_181111.jpg?ex=692ad54e&is=692983ce&hm=53bb27e9c56bcb51e1fcf74d246d3f9aab58bd59f86902c557608c63df55284f&")
          .setFooter({ text: "Valencia Bot | Version 1.0.1" })
          .setTimestamp();
        
        // Kirim DM
        let dmSent = true;
        try {
          await interaction.user.send({ embeds: [embed] });
        } catch (error) {
          console.error("Gagal mengirim DM:", error);
          dmSent = false;
        }

        // Set nickname & role (async, tidak perlu await untuk user experience)
        try {
          const member = await interaction.guild.members.fetch(DiscordID);
          await member.setNickname(ucpName);
          await member.roles.add(roleCitizen);
        } catch (error) {
          console.error("Gagal set nickname/role:", error);
        }

        // Response berdasarkan status DM
        if (dmSent) {
          await interaction.editReply({
            content: "✅ Registrasi berhasil! Silakan cek DM Anda untuk informasi akun.",
          });
        } else {
          await interaction.editReply({
            content: "⚠️ Registrasi berhasil, namun bot gagal mengirim DM. Pastikan DM Anda terbuka atau hubungi admin untuk informasi lebih lanjut.",
          });
        }
      } else {
        await interaction.editReply({
          content: "❌ Nama UCP sudah digunakan. Silakan coba dengan nama lain.",
        });
      }
    } catch (error) {
      console.error("Error in register modal:", error);
      
      // Safe error response
      if (interaction.deferred) {
        await interaction.editReply({
          content: "❌ Terjadi kesalahan saat memproses registrasi. Silakan coba lagi.",
        }).catch(() => {});
      }
    }
  },
};