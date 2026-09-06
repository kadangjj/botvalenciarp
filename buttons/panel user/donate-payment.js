const { EmbedBuilder, AttachmentBuilder, MessageFlags } = require("discord.js");
const path = require("path");

module.exports = {
  customId: "donate_payment",
  async execute(interaction) {
    // Letakkan file QRIS kamu di /home/container/assets/qris.png
    const qrisPath = path.join(__dirname, "../../assets/qris.png");

    let attachment;
    try {
      attachment = new AttachmentBuilder(qrisPath, { name: "qris.png" });
    } catch {
      // Kalau file tidak ada, kirim embed tanpa gambar
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#00C853")
            .setTitle("Informasi Pembayaran")
            .setDescription(
              "**Metode Pembayaran: QRIS**\n\n" +
              "File QRIS belum diupload.\n" +
              "Letakkan file QRIS di `assets/qris.png`."
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("Informasi Pembayaran")
      .setDescription(
        "**Metode Pembayaran: QRIS**\n\n" +
        "Scan QR code di bawah untuk melakukan pembayaran.\n\n" +
        "Setelah transfer, kirim **bukti pembayaran** di tiket ini.\n" +
        `Info lengkap: <#1330494883382956099>`
      )
      .setImage("attachment://qris.png")
      .setFooter({ text: "Valencia Roleplay — Payment" })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      files: [attachment],
      flags: MessageFlags.Ephemeral,
    });
  },
};