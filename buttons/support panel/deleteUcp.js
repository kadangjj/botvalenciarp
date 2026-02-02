const {
  getUserData,
  deleteAccountByDiscordID,
} = require("../../functions/dataFunction");

module.exports = {
  customId: "UcpDelete",
  async execute(interaction) {
    const DiscordID = interaction.user.id;

    try {
      const userData = await getUserData(DiscordID);

      if (!userData) {
        return await interaction.reply({
          content: "❌ Akun UCP Anda tidak ditemukan di database.",
          ephemeral: true,
        });
      }

      // Buat confirmation embed
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      
      const confirmEmbed = new EmbedBuilder()
        .setColor("#FFA500")
        .setTitle("⚠️ KONFIRMASI PENGHAPUSAN UCP")
        .setDescription(`Anda akan menghapus akun UCP: **${userData.ucp}**`)
        .addFields(
          {
            name: "📛 UCP Name",
            value: userData.ucp,
            inline: true
          },
          {
            name: "🚫 WARNING",
            value: "**THIS ACTION CANNOT BE UNDONE!**\nAll character data, progress, and items will be permanently lost!",
            inline: false
          }
        )
        .setFooter({ text: "Pastikan ini adalah keputusan yang benar" });

      // Buat action row dengan buttons
      const confirmRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('confirm_delete_ucp')
            .setLabel('✅ CONFIRM')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('cancel_delete_ucp')
            .setLabel('❌ CANCEL')
            .setStyle(ButtonStyle.Secondary)
        );

      // Kirim embed konfirmasi
      await interaction.reply({
        embeds: [confirmEmbed],
        components: [confirmRow],
        ephemeral: true
      });

      // Buat collector untuk menangani response
      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ 
        filter, 
        time: 30000, // 30 detik
        max: 1 
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'confirm_delete_ucp') {
          // User konfirmasi hapus
          const isDeleted = await deleteAccountByDiscordID(DiscordID);

          if (isDeleted) {
            await i.update({
              content: `✅ Akun UCP **${userData.ucp}** telah berhasil dihapus permanen!`,
              embeds: [],
              components: [],
              ephemeral: true
            });
          } else {
            await i.update({
              content: "❌ Gagal menghapus akun UCP Anda. Silakan coba lagi.",
              embeds: [],
              components: [],
              ephemeral: true
            });
          }
        } else if (i.customId === 'cancel_delete_ucp') {
          // User batalkan
          await i.update({
            content: "❌ Penghapusan UCP dibatalkan. Data Anda tetap aman.",
            embeds: [],
            components: [],
            ephemeral: true
          });
        }
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          // Timeout
          interaction.editReply({
            content: "⏰ Waktu konfirmasi habis. Penghapusan UCP dibatalkan.",
            embeds: [],
            components: [],
            ephemeral: true
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error("Error in UCP deletion:", error);
      await interaction.reply({
        content: "❌ Terjadi kesalahan saat memproses permintaan Anda.",
        ephemeral: true,
      });
    }
  },
};