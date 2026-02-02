const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const path = require("path");
const fs = require("fs");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logsupdate")
    .setDescription("View the available update logs"),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    const dataPath = path.join(__dirname, "../", "../", "data", "updates.json");

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

      const options = jsonData.updates.map((update) => ({
        label: `Versi ${update.version} - ${update.timestamp}`,
        value: update.version,
      }));

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("Pilih Versi Update")
        .setDescription(
          "Silakan pilih versi update dari dropdown di bawah untuk melihat logs update."
        )
        .setTimestamp()
        .setFooter({ text: "Valencia Bot | Logs Update" });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("select_version")
        .setPlaceholder("Pilih versi update")
        .addOptions(options);

      const actionRow = new ActionRowBuilder().addComponents(selectMenu);

      interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true,
      });
    });
  },
};
