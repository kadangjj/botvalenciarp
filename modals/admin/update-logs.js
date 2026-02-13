const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const config = require("../../config.json");

module.exports = {
  customId: "update-log-modal",
  async execute(interaction) {
    const version = interaction.fields.getTextInputValue("version");
    const logs = interaction.fields.getTextInputValue("logs");

    // Format logs dengan bullet points
    const formattedLogs = logs
      .split("|")
      .map((item) => {
        const trimmedItem = item.trim();
        return trimmedItem.startsWith("+") || trimmedItem.startsWith("-") 
          ? trimmedItem 
          : `+ ${trimmedItem}`;
      })
      .join("\n");

    const timestamp = moment().tz("Asia/Jakarta").format("YYYY-MM-DD HH:mm:ss");

    const updateData = {
      version: version,
      log: formattedLogs,
      timestamp: timestamp,
    };

    const dataPath = path.join(__dirname, "../", "../", "data", "updates.json");

    fs.readFile(dataPath, "utf8", async (err, data) => {
      let jsonData = { updates: [] };

      if (!err && data) {
        try {
          jsonData = JSON.parse(data);
        } catch (parseErr) {
          console.error("Error parsing JSON:", parseErr);
        }
      }

      const existingUpdate = jsonData.updates.find(
        (update) => update.version === version
      );

      if (existingUpdate) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription(`Versi **${version}** sudah ada dalam daftar update!`),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      jsonData.updates.push(updateData);

      fs.writeFile(dataPath, JSON.stringify(jsonData, null, 2), async (err) => {
        if (err) {
          console.error("Error saving update:", err);
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription("Terjadi kesalahan saat menyimpan update."),
            ],
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        console.log("Update saved successfully!");

        // Reply ke interaction dulu
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0x00ff00)
              .setDescription(`Update version **${version}** telah disimpan dengan sukses!`),
          ],
          flags: MessageFlags.Ephemeral,
        });

        // Kirim embed ke update logs channel
        try {
          // PERBAIKAN: Pakai config.channels.updateLogs
          const updateChannel = interaction.client.channels.cache.get(
            config.channels.updateLogs
          );

          if (!updateChannel) {
            console.error("Update channel not found! Channel ID:", config.channels.updateLogs);
            return;
          }

        

          // Buat embed dengan styling seperti di gambar
          const embed = new EmbedBuilder()
            .setAuthor({
              name: interaction.user.username,
              iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`VL ${version} Forge`)
            .setDescription(`\`\`\`diff\n${formattedLogs}\nand some minor bug fixes.\`\`\``)
            .setColor("#2b2d31")
            .setFooter({
              text: "Valencia Roleplay • Still High",
              iconURL:
                "https://cdn.discordapp.com/attachments/1330494882778845301/1443922699033514034/20251128_181111.jpg?ex=692ad54e&is=692983ce&hm=53bb27e9c56bcb51e1fcf74d246d3f9aab58bd59f86902c557608c63df55284f&",
            })
            .setTimestamp();

          await updateChannel.send({ embeds: [embed] });
          console.log("Update log sent successfully!");

        } catch (error) {
          console.error("Error sending update log to channel:");
          console.error("Error:", error);
        }
      });
    });
  },
};