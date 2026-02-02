const { EmbedBuilder } = require("discord.js");
const { readFileSync, writeFileSync } = require("fs");
const config = require("../../config.json");

module.exports = {
  customId: /^reject_reason_.+/,
  async execute(interaction) {
    const characterName = interaction.customId.replace("reject_reason_", "");
    const reason = interaction.fields.getTextInputValue("reason");
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

    data.pendingRequests = data.pendingRequests.filter(
      (req) => req.characterName !== characterName
    );
    writeFileSync(dataPath, JSON.stringify(data, null, 2));

    const user = await interaction.client.users.fetch(request.DiscordID);
    if (user) {
      const embed = new EmbedBuilder()
        .setColor("#FA0F0F")
        .setTitle("Character Story rejected")
        .setDescription(
          `Character story Anda dengan nama **${request.characterName}** telah ditolak.\n` +
            `**Alasan Penolakan:**\n${reason}`
        )
        .setTimestamp()
        .setFooter({ text: "Valencia Roleplay - Still High" });

      await user.send({ embeds: [embed] }).catch(() => {
        console.error("Gagal mengirim DM ke pengguna.");
      });
    }

    const rejectedChannel = interaction.client.channels.cache.get(
      config.channels.logsaccCs
    );
    const logEmbed = new EmbedBuilder()
      .setColor("#FA0F0F")
      .setTitle("Character Story rejected")
      .setDescription(
        `Character story untuk character **${request.characterName}** telah ditolak oleh admin.\n` +
          `Diajukan oleh: <@${request.DiscordID}>\n` +
          `**Alasan Penolakan:**\n${reason}`
      )
      .setTimestamp()
      .setFooter({
        text: `Ditolak oleh admin: @${interaction.user.tag}`,
      });

    await rejectedChannel.send({ embeds: [logEmbed] });

    await interaction.message.edit({ components: [] });

    await interaction.reply({
      content: "✅ Character story ditolak!",
      ephemeral: true,
    });
  },
};
