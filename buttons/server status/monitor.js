const { EmbedBuilder } = require("discord.js");
const samp = require("samp-query");
const config = require("../../config.json");

const SERVER_IP = config.server.serverIP;
const SERVER_PORT = config.server.serverPort;

module.exports = {
  customId: "monitor",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }
    try {
      const options = {
        host: SERVER_IP,
        port: SERVER_PORT,
        timeout: 1000,
      };

      samp(options, (error, response) => {
        if (error) {
          console.error("Gagal mengakses server:", error);
          const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(`${options.host}:${options.port}`)
            .setDescription("Server is offline");

          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const toString = (value) =>
          value !== undefined && value !== null
            ? String(value)
            : "Tidak diketahui";

        const hostname = toString(response.hostname); // Nama server
        const gamemode = toString(response.gamemode); // Gamemode server
        const mapname = toString(response.mapname); // Nama map
        const onlinePlayers = toString(response.online); // Pemain online
        const maxPlayers = toString(response.maxplayers); // Maksimal pemain yang bisa login

        const serverVersion = toString(response.version); // Versi server
        const language = toString(response.language); // Bahasa server
        const weather = toString(response.rules?.weather); // Cuaca
        const worldTime = toString(response.rules?.worldtime); // Waktu dunia
        const pass = response.passworded ? "Yes" : "No"; // server password anjg

        const monitorEmbed = new EmbedBuilder()
          .setColor("#00cc66")
          .setTitle(`**${hostname}**`)
          .addFields(
            {
              name: "IP:PORT",
              value: `${options.host}:${options.port}`,
              inline: true,
            },
            {
              name: "Pemain",
              value: `${onlinePlayers}/${maxPlayers}`,
              inline: true,
            },
            { name: "Gamemode", value: gamemode, inline: true },
            { name: "Map", value: mapname, inline: true },
            { name: "Bahasa", value: language, inline: true },
            {
              name: "Cuaca - Waktu",
              value: `${worldTime} - ${weather}`,
              inline: true,
            },
            { name: "Versi Server", value: serverVersion, inline: true },
            { name: "Password", value: pass, inline: true },
            {
              name: "URL",
              value: `[Klik di sini](https://${
                response.rules?.weburl || "https://sa-mp.com"
              })`,
              inline: true,
            }
          )
          .setTimestamp()
          .setFooter({ text: "Valencia performance | Still High" });

        return interaction.reply({ embeds: [monitorEmbed], ephemeral: false });
      });
    } catch (error) {
      console.error("Error:", error);
      await interaction.reply({
        content: "Gagal mengambil data dari server.",
        ephemeral: true,
      });
    }
  },
};
