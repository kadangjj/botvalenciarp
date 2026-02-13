const { EmbedBuilder } = require("discord.js");
const {
  generatePin,
  insertUser,
  isUserRegistered,
} = require("../../functions/register");
const { sendRegistrationEmail } = require("../../functions/emailService");
const { pool } = require("../../functions/database");
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

      // Validasi Email Format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      if (!emailRegex.test(email)) {
         return interaction.editReply({
          embeds: [{
            color: 0xFF0000,
            title: "Email Tidak Valid",
            description: "Mohon masukkan email yang benar.\n**Contoh:** `user@example.com`"
          }]
        });
      }

      // Cek apakah email sudah terdaftar
      const [emailCheck] = await pool.query(
        "SELECT ucp FROM playerucp WHERE email = ?",
        [email]
      );

      if (emailCheck.length > 0) {
        return interaction.editReply({
          embeds: [{
            color: 0xFF0000,
            title: "Email Sudah Terdaftar",
            description: `Email **${email}** sudah digunakan oleh akun lain.\nSilakan gunakan email yang berbeda.`
          }]
        });
      }
      
      // Cek apakah Discord ID sudah terdaftar
      if (await isUserRegistered(DiscordID)) {
        return interaction.editReply({
          embeds: [{
            color: 0xFF0000,
            title: "Sudah Terdaftar",
            description: "Kamu sudah memiliki UCP yang terdaftar."
          }]
        });
      }

      const verifycode = generatePin();
      const success = await insertUser(ucpName, DiscordID, verifycode, email);
      
      if (success) {
        const embed = new EmbedBuilder()
          .setColor("#10b981")
          .setTitle("Registrasi Berhasil!")
          .setDescription(
            "Selamat! Akun UCP Anda telah berhasil dibuat.\n\n"
          )
          .addFields(
            { 
              name: "UCP Name", 
              value: `\`${ucpName}\``, 
              inline: true 
            },
            { 
              name: "Email", 
              value: `\`${email}\``, 
              inline: true 
            },
            { 
              name: "PIN Code", 
              value: `\`${verifycode}\``, 
              inline: false 
            },
            {
              name: "Catatan Penting",
              value: "```diff\n+ Simpan informasi ini dengan baik\n- Jangan bagikan PIN kepada siapapun\n- Termasuk Tim Administrator!\n```",
              inline: false
            },
            {
              name: "Langkah Selanjutnya",
              value: "• Login ke Server menggunakan kredensial di atas\n• Buat karakter pertama Anda\n• Mulai petualangan di Valencia Roleplay!",
              inline: false
            }
          )
          .setThumbnail("https://cdn.discordapp.com/attachments/1330494882778845301/1443922699033514034/20251128_181111.jpg?ex=692ad54e&is=692983ce&hm=53bb27e9c56bcb51e1fcf74d246d3f9aab58bd59f86902c557608c63df55284f&")
          .setFooter({ text: "Valencia Roleplay | Selamat Bergabung!" })
          .setTimestamp();
        
        // Kirim DM
        let dmSent = false;
        try {
          await interaction.user.send({ embeds: [embed] });
          dmSent = true;
          console.log(`✅ DM sent to ${interaction.user.tag}`);
        } catch (error) {
          console.error("❌ Gagal mengirim DM:", error.message);
        }

        // Kirim Email
        let emailSent = false;
        try {
          const emailResult = await sendRegistrationEmail(email, {
            ucpName: ucpName,
            verifycode: verifycode
          });
          
          if (emailResult.success) {
            emailSent = true;
            console.log(`✅ Email sent to: ${email}`);
          } else {
            console.error(`❌ Gagal mengirim email:`, emailResult.error);
          }
        } catch (error) {
          console.error("❌ Error saat mengirim email:", error.message);
        }

        // Set nickname & role
        try {
          const member = await interaction.guild.members.fetch(DiscordID);
          await member.setNickname(ucpName);
          await member.roles.add(roleCitizen);
          console.log(`Nickname & role set for ${ucpName}`);
        } catch (error) {
          console.error("❌ Gagal set nickname/role:", error.message);
        }

        // Response sukses (1 embed saja)
        const successEmbed = new EmbedBuilder()
          .setColor(dmSent && emailSent ? 0x10b981 : 0xfbbf24)
          .setTitle(dmSent && emailSent ? "Registrasi Berhasil!" : "Registrasi Berhasil (Peringatan)")
          .setDescription(
            dmSent && emailSent
              ? `Informasi akun Anda telah dikirim ke:\n**Discord DM** | **Email** (${email})`
              : `Akun berhasil dibuat, namun:\n${!dmSent ? '**Discord DM** - Gagal terkirim (Pastikan DM terbuka)\n' : ''}${!emailSent ? '**Email** - Gagal terkirim\n' : ''}\n**Simpan informasi di bawah ini!**`
          )
          .setFooter({ text: "Valencia Roleplay | Selamat Bergabung!" })
          .setTimestamp();

        // Jika keduanya gagal, tampilkan PIN
        if (!dmSent && !emailSent) {
          successEmbed.addFields({
            name: "PIN Code",
            value: `\`${verifycode}\``,
            inline: false
          });
          successEmbed.addFields({
            name: "PENTING",
            value: "Simpan PIN ini dengan baik! Jangan bagikan kepada siapapun.",
            inline: false
          });
        }

        await interaction.editReply({
          embeds: [successEmbed]
        });

      } else {
        await interaction.editReply({
          embeds: [{
            title: "Registrasi Gagal",
            color: 0xFF0000,
            description: "Nama UCP **" + ucpName + "** sudah digunakan.\nSilakan coba dengan nama lain."
          }]
        });
      }
    } catch (error) {
      console.error("Error in register modal:", error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          embeds: [{
            title: "Registrasi Gagal",
            color: 0xFF0000,
            description: "Terjadi kesalahan saat memproses registrasi.\nSilakan coba lagi atau hubungi administrator."
          }]
        }).catch(() => {});
      }
    }
  },
};