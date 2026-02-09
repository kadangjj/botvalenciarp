const { EmbedBuilder } = require("discord.js");
const { pool } = require("../../functions/database");
const config = require("../../config.json");

module.exports = {
  customId: "refresh_stats",
  async execute(interaction) {
    // Cek role admin
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Akses Ditolak")
            .setDescription("Anda tidak memiliki izin untuk mengakses fitur ini!")
        ],
        ephemeral: true,
      });
    }

    await interaction.deferUpdate();

    try {
      const serverStats = await fetchServerStats();
      const statsEmbed = createStatsEmbed(serverStats);
      const row = createButtons();

      await interaction.editReply({ embeds: [statsEmbed], components: [row] });
      
      // Kirim notifikasi sukses
      await interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription("Statistik server berhasil diperbarui!")
        ],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error refreshing stats:", error);
      await interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Error")
            .setDescription("Terjadi kesalahan saat memperbarui statistik server.")
        ],
        ephemeral: true,
      });
    }
  },
};

function createStatsEmbed(serverStats) {
  return new EmbedBuilder()
    .setColor("#1E90FF")
    .setTitle("🌐 **Server Statistics**")
    .setDescription(
      `📌 **Current Server Statistics**:\n\n` +
        `👥 **UCP Registered**: \`${serverStats.registeredPlayers}\`\n` +
        `🎭 **Character**: \`${serverStats.totalCharacters}\`\n` +
        `🚗 **Private Vehicle**: \`${serverStats.totalVehicles}\`\n` +
        `🏬 **Dealership**: \`${serverStats.totalDealerships}\`\n` +
        `🏠 **House**: \`${serverStats.totalHouses}\`\n` +
        `🚪 **Public Park**: \`${serverStats.totalGarages}\`\n` +
        `⛔ **Player Banned**: \`${serverStats.bannedPlayers}\`\n` +
        `💼 **Business**: \`${serverStats.totalBusinesses}\`\n\n` +
        `*Last Update: <t:${Math.floor(Date.now() / 1000)}:R>*`
    )
    .setTimestamp()
    .setFooter({
      text: "Valencia - Server Panel • Updates every 12 hours",
      iconURL: config.server.logo,
    });
}

function createButtons() {
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
  
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("monitor")
      .setLabel("🖥️ Monitor Server")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("update-logs")
      .setLabel("🛠️ Create Update Log")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("faq_button")
      .setLabel("📝 Create FAQ")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("refresh_stats")
      .setLabel("🔄 Refresh Now")
      .setStyle(ButtonStyle.Secondary)
  );
}

async function fetchServerStats() {
  try {
    const queries = {
      registeredPlayers: "SELECT COUNT(*) AS total FROM playerucp;",
      totalCharacters: "SELECT COUNT(*) AS total FROM players;",
      totalVehicles: "SELECT COUNT(*) AS total FROM vehicle;",
      totalDealerships: "SELECT COUNT(*) AS total FROM dealership;",
      totalHouses: "SELECT COUNT(*) AS total FROM houses;",
      totalGarages: "SELECT COUNT(*) AS total FROM parks;",
      bannedPlayers: "SELECT COUNT(*) AS total FROM banneds;",
      totalBusinesses: "SELECT COUNT(*) AS total FROM bisnis;",
    };

    const results = await Promise.all(
      Object.entries(queries).map(async ([key, query]) => {
        const [rows] = await pool.query(query);
        return { [key]: rows[0].total };
      })
    );

    return results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
  } catch (error) {
    console.error("Error fetching server stats:", error);
    throw error;
  }
}