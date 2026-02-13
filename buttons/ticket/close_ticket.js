// ============================================
// FILE: buttons/close_ticket.js
// ============================================
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require("discord.js");
const config = require("../../config.json"); // FIXED: Naik 2 level dari buttons/ticket/

module.exports = {
  customId: "close_ticket",
  async execute(interaction) {
    const channel = interaction.channel;

    // Check if it's a ticket channel
    if (!channel.name.startsWith("ticket-") && 
        !channel.name.startsWith("donate-") && 
        !channel.name.startsWith("report-") && 
        !channel.name.startsWith("unbanned-")) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription("Command ini hanya bisa digunakan di ticket channel!"),
        ],
        ephemeral: true,
      });
    }

    // Check if user has permission
    const isAdmin = interaction.member.roles.cache.has(config.roles.adminRole);
    const usernameFromChannel = channel.name.split("-").slice(1).join("-");
    const isOwner = usernameFromChannel === interaction.user.username.toLowerCase();

    if (!isAdmin && !isOwner) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription("Anda tidak memiliki izin untuk menutup ticket ini!"),
        ],
        ephemeral: true,
      });
    }

    // Confirmation embed
    const confirmEmbed = new EmbedBuilder()
      .setColor("#FF0000")
      .setTitle("Konfirmasi Penutupan Ticket")
      .setDescription(
        "Apakah Anda yakin ingin menutup ticket ini?\n\n" +
        "Transcript akan disimpan di log channel\n" +
        "Channel akan dihapus dalam **5 detik** setelah konfirmasi."
      )
      .setTimestamp();

    const confirmButton = new ButtonBuilder()
      .setCustomId("confirm_close_ticket")
      .setLabel("✅ Ya, Tutup")
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId("cancel_close_ticket")
      .setLabel("❌ Batal")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

    const reply = await interaction.reply({
      embeds: [confirmEmbed],
      components: [row],
      fetchReply: true,
    });

    // Collector untuk button
    const collector = reply.createMessageComponentCollector({
      time: 30000,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription("Ini bukan untuk Anda!"),
          ],
          ephemeral: true,
        });
      }

      if (i.customId === "confirm_close_ticket") {
        const closeEmbed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("🔒 Ticket Ditutup")
          .setDescription(
            `Ticket ditutup oleh ${interaction.user}\n\n` +
            "Menyimpan transcript...\n" +
            "Channel akan dihapus dalam **5 detik**..."
          )
          .setTimestamp();

        await i.update({
          embeds: [closeEmbed],
          components: [],
        });

        // Generate transcript
        try {
          const messages = await channel.messages.fetch({ limit: 100 });
          const transcript = messages
            .reverse()
            .map((msg) => {
              const time = msg.createdAt.toLocaleString("id-ID", {
                timeZone: "Asia/Jakarta",
                dateStyle: "short",
                timeStyle: "medium",
              });
              return `[${time}] ${msg.author.tag}: ${msg.content}`;
            })
            .join("\n");

          // Determine ticket type
          let ticketType = "GENERAL";
          let ticketColor = "#808080";
          if (channel.name.startsWith("donate-")) {
            ticketType = "DONATE";
            ticketColor = "#00FF00";
          } else if (channel.name.startsWith("report-")) {
            ticketType = "REPORT";
            ticketColor = "#FF0000";
          } else if (channel.name.startsWith("unbanned-")) {
            ticketType = "REQ UNBANNED";
            ticketColor = "#5865F2";
          }

          // Send to log channel
          const logChannel = interaction.guild.channels.cache.get(config.ticket.logChannelId);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setColor(ticketColor)
              .setTitle("TICKET CLOSED")
              .setDescription(
                `**Type:** ${ticketType}\n` +
                `**Channel:** ${channel.name}\n` +
                `**Closed By:** ${interaction.user}`
              )
              .addFields(
                { name: "Ticket Creator", value: usernameFromChannel, inline: true },
                { name: "Channel ID", value: channel.id, inline: true },
                { name: "Closed At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                { name: "Total Messages", value: `${messages.size} pesan`, inline: true }
              )
              .setTimestamp();

            const attachment = new AttachmentBuilder(
              Buffer.from(transcript, "utf-8"),
              { name: `transcript-${channel.name}.txt` }
            );

            await logChannel.send({
              embeds: [logEmbed],
              files: [attachment],
            });
          }
        } catch (error) {
          console.error("❌ Error generating transcript:", error);
        }

        console.log(`🔒 Ticket closed: ${channel.name} by ${interaction.user.tag}`);

        // Delete channel after 5 seconds
        setTimeout(async () => {
          try {
            await channel.delete();
          } catch (error) {
            console.error("❌ Error deleting ticket:", error);
          }
        }, 5000);

      } else if (i.customId === "cancel_close_ticket") {
        await i.update({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription("Penutupan ticket dibatalkan."),
          ],
          components: [],
        });
      }

      collector.stop();
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setDescription("⏱Waktu konfirmasi habis. Silakan coba lagi."),
          ],
          components: [],
        });
      }
    });
  },
};