const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "select_version",
  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    const selectedVersion = interaction.values[0];

    const dataPath = path.join(__dirname, "../", "data", "updates.json");

    fs.readFile(dataPath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading updates.json:", err);
        return interaction.reply({
          content: "Terjadi kesalahan saat membaca data update.",
          ephemeral: true,
        });
      }

      let jsonData = { updates: [] };

      if (data) {
        jsonData = JSON.parse(data);
      }

      const update = jsonData.updates.find(
        (update) => update.version === selectedVersion
      );

      if (!update) {
        return interaction.reply({
          content: "Versi yang dipilih tidak ditemukan.",
          ephemeral: true,
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`**Valencia Updates Version ${update.version}**`)
        .setDescription(update.log)
        .addFields({
          name: "Tanggal Update",
          value: update.timestamp,
          inline: false,
        })
        .setTimestamp()
        .setFooter({ text: "Valencia Roleplay | Logs Update" });

      interaction.reply({
        content: `Logs update untuk versi **${update.version}**:`,
        embeds: [embed],
        components: [],
      });
    });
  },
};
