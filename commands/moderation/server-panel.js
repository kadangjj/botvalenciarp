const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require("discord.js");
const { pool } = require("../../functions/database");
const config = require("../../config.json");

// Store active intervals
const activeIntervals = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverpanel")
    .setDescription("view server statistics and other server controls!."),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        content: "❌ Anda tidak memiliki izin!",
        ephemeral: true,
      });
    }

    const serverStats = await fetchServerStats();
    const statsEmbed = createStatsEmbed(serverStats);
    const row = createButtons();

    const message = await interaction.reply({
      embeds: [statsEmbed],
      components: [row],
      fetchReply: true,
    });

    // Clear interval lama jika ada
    if (activeIntervals.has(interaction.channelId)) {
      clearInterval(activeIntervals.get(interaction.channelId));
    }

    // Auto-update setiap 12 jam
    const interval = setInterval(async () => {
      try {
        const newStats = await fetchServerStats();
        const newEmbed = createStatsEmbed(newStats);
        await message.edit({ embeds: [newEmbed], components: [row] });
      } catch (error) {
        console.error("Error updating stats:", error);
        clearInterval(interval);
        activeIntervals.delete(interaction.channelId);
      }
    }, 43200000); // 12 jam = 43200000 ms

    // Simpan interval
    activeIntervals.set(interaction.channelId, interval);
  },
};

function createStatsEmbed(serverStats) {
  return new EmbedBuilder()
    .setColor("#1E90FF")
    .setTitle("🌐 **Server Statistics**")
       .setDescription(
      `### Current Server Statistics\n\n` +
      `> 👥 **UCP REGISTERED** • \`${serverStats.registeredPlayers}\`\n` +
      `> 🎭 **CHARACTER** • \`${serverStats.totalCharacters}\`\n` +
      `> 🚗 **PRIVATE VEHICLE** • \`${serverStats.totalVehicles}\`\n` +
      `> 🏬 **DEALERSHIP** • \`${serverStats.totalDealerships}\`\n` +
      `> 🏠 **HOUSE** • \`${serverStats.totalHouses}\`\n` +
      `> 🚪 **PUBLIC PARK** • \`${serverStats.totalGarages}\`\n` +
      `> ⛔ **PLAYER BANNED** • \`${serverStats.bannedPlayers}\`\n` +
      `> 💼 **BUSINESS** • \`${serverStats.totalBusinesses}\`\n\n` +
      `*Last Update: <t:${Math.floor(Date.now() / 1000)}:R>*`
    )
    .setTimestamp()
    .setFooter({
      text: "Valencia - Server Panel • Updates every 12 hours",
      iconURL: config.server.logo,
    });
}

function createButtons() {
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