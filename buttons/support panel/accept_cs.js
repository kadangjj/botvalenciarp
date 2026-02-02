const { EmbedBuilder } = require("discord.js");
const { pool } = require("../../functions/database");
const { readFileSync, writeFileSync } = require("fs");
const config = require("../../config.json");

module.exports = {
  customId: /^accept_cs_.+/,
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }

    const characterName = interaction.customId.replace("accept_cs_", "");
    const dataPath = "./data/pending_requests.json";
    const data = JSON.parse(readFileSync(dataPath, "utf8"));
    const request = data.pendingRequests.find(
      (req) => req.characterName === characterName
    );

    if (!request) {
      return interaction.reply({
        content: "❌ Pendaftaran tidak ditemukan!",
        ephemeral: true,
      });
    }

    const query = `UPDATE players SET characterstory = 1 WHERE username = ?;`;
    await pool.query(query, [characterName]);

    data.pendingRequests = data.pendingRequests.filter(
      (req) => req.characterName !== characterName
    );
    writeFileSync(dataPath, JSON.stringify(data, null, 2));

    const acceptedChannelId = config.channels.logsaccCs;
    let acceptedChannel;

    try {
      acceptedChannel = await interaction.guild.channels.fetch(
        acceptedChannelId
      );
    } catch (error) {
      console.error("Error fetching channel:", error);
      return interaction.reply({
        content: "❌ Gagal mengambil informasi channel log!",
        ephemeral: true,
      });
    }

    if (!acceptedChannel) {
      console.error("Accepted channel not found or bot lacks access!");
      return interaction.reply({
        content: "❌ Channel untuk log penerimaan tidak ditemukan!",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#3ACB26")
      .setTitle("Character Story accepted")
      .setDescription(
        `Character story untuk character **${request.characterName}** telah diterima oleh admin.\n` +
          `Diajukan oleh: <@${request.DiscordID}>`
      )
      .setTimestamp()
      .setFooter({
        text: `Diterima oleh admin: @${interaction.user.tag}`,
      });

    await acceptedChannel.send({ embeds: [embed] });

    await interaction.message.edit({ components: [] });

    await interaction.reply({
      content: "✅ Character story diterima!",
      ephemeral: true,
    });
  },
};
