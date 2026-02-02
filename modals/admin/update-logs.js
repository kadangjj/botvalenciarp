const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

module.exports = {
  customId: "update-log-modal",
  async execute(interaction) {
    const version = interaction.fields.getTextInputValue("version");
    const logs = interaction.fields.getTextInputValue("logs");

    const formattedLogs = logs
      .split("|")
      .map((item) => {
        const trimmedItem = item.trim();
        return trimmedItem.startsWith("-") ? trimmedItem : `- ${trimmedItem}`;
      })
      .join("\n");

    const timestamp = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

    const updateData = {
      version: version,
      log: formattedLogs,
      timestamp: timestamp,
    };

    const dataPath = path.join(__dirname, "../", "../","data", "updates.json");

    fs.readFile(dataPath, "utf8", (err, data) => {
      let jsonData = { updates: [] };

      if (!err && data) {
        jsonData = JSON.parse(data);
      }

      const existingUpdate = jsonData.updates.find(
        (update) => update.version === version
      );

      if (existingUpdate) {
        interaction.reply({
          content: `Versi **${version}** sudah ada dalam daftar update!`,
          ephemeral: true,
        });
        return;
      }

      jsonData.updates.push(updateData);

      fs.writeFile(dataPath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          console.error("Error saving update:", err);
          interaction.reply({
            content: "Terjadi kesalahan saat menyimpan update.",
            ephemeral: true,
          });
          return;
        }

        console.log("Update saved successfully!");
        interaction.reply({
          content: `Update version **${version}** telah disimpan dengan sukses!`,
          ephemeral: true,
        });
      });
    });
  },
};
