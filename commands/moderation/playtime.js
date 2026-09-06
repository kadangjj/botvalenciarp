const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { pool } = require("../../functions/database");

function formatPlaytime(hours, minutes, seconds) {
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatSecondsToReadable(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${totalSeconds % 60}s`;
}

function getMedal(rank) {
  switch (rank) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return `**#${rank}**`;
  }
}

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
}

function getDateRange(period, dateStart, dateEnd) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  let start, end, label;

  switch (period) {
    case "7days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().slice(0, 10);
      end = todayStr;
      label = "7 Hari Terakhir";
      break;
    }
    case "30days": {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      start = d.toISOString().slice(0, 10);
      end = todayStr;
      label = "30 Hari Terakhir";
      break;
    }
    case "thismonth": {
      start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      end = todayStr;
      const monthName = now.toLocaleString("id-ID", { month: "long", year: "numeric" });
      label = `Bulan Ini (${monthName})`;
      break;
    }
    case "custom": {
      start = dateStart;
      end = dateEnd;
      label = `${dateStart} s/d ${dateEnd}`;
      break;
    }
    default: {
      label = "All Time";
      start = null;
      end = null;
    }
  }

  return { start, end, label };
}

async function fetchPeriodLeaderboard(startDate, endDate, limit) {
  const [rows] = await pool.execute(
    `SELECT 
      p.username,
      p.level,
      (snap_end.total_seconds - COALESCE(snap_start.total_seconds, 0)) AS gained_seconds
    FROM players p
    JOIN (
      SELECT username, total_seconds
      FROM playtime_snapshots
      WHERE snapshot_date = (
        SELECT MAX(snapshot_date)
        FROM playtime_snapshots s2
        WHERE s2.username = playtime_snapshots.username
          AND s2.snapshot_date <= ?
      )
    ) snap_end ON snap_end.username = p.username
    LEFT JOIN (
      SELECT username, total_seconds
      FROM playtime_snapshots
      WHERE snapshot_date = (
        SELECT MAX(snapshot_date)
        FROM playtime_snapshots s3
        WHERE s3.username = playtime_snapshots.username
          AND s3.snapshot_date < ?
      )
    ) snap_start ON snap_start.username = p.username
    HAVING gained_seconds > 0
    ORDER BY gained_seconds DESC
    LIMIT ?`,
    [endDate, startDate, limit]
  );
  return rows;
}

async function buildAlltimeEmbed(limit) {
  const [players] = await pool.execute(
    `SELECT
      username, level, hours, minutes, seconds,
      (hours * 3600 + minutes * 60 + seconds) AS total_seconds
    FROM players
    WHERE hours > 0 OR minutes > 0 OR seconds > 0
    ORDER BY total_seconds DESC
    LIMIT ?`,
    [limit]
  );

  if (!players || players.length === 0) return null;

  let leaderboard = "";
  players.forEach((player, index) => {
    const medal = getMedal(index + 1);
    const playtime = formatPlaytime(player.hours, player.minutes, player.seconds);
    const totalHours = Math.floor(player.total_seconds / 3600);
    leaderboard += `${medal} **${player.username}** • Lvl ${player.level}\n`;
    leaderboard += `⏱️ \`${playtime}\` *(${totalHours.toLocaleString()}h total)*\n\n`;
  });

  const totalPlaytime = players.reduce((sum, p) => sum + p.total_seconds, 0);
  const avgPlaytime = Math.floor(totalPlaytime / players.length / 3600);
  const now = new Date();
  const nextUpdate = new Date(now.getTime() + 60 * 60 * 1000);

  return new EmbedBuilder()
    .setTitle("Playtime Leaderboard — All Time")
    .setDescription(leaderboard)
    .setColor("#FFD700")
    .addFields(
      {
        name: "Statistik",
        value: `**Total Players**: ${players.length}\n**Rata-rata**: ${avgPlaytime}h`,
        inline: true,
      },
      {
        name: "Top Player",
        value: `**${players[0].username}**\n${formatPlaytime(players[0].hours, players[0].minutes, players[0].seconds)}`,
        inline: true,
      },
      {
        name: "Terakhir Diupdate",
        value: `<t:${Math.floor(now.getTime() / 1000)}:R>\nUpdate berikutnya: <t:${Math.floor(nextUpdate.getTime() / 1000)}:R>`,
        inline: false,
      }
    )
    .setFooter({ text: `Valencia Roleplay • Top ${limit} Players • All Time` })
    .setTimestamp();
}

const errorEmbed = (title, description) =>
  new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle(title)
    .setDescription(description);

// Simpan interval aktif per message agar tidak double interval
const activeIntervals = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playtime")
    .setDescription("View top players by playtime")
    .addStringOption(option =>
      option
        .setName("period")
        .setDescription("Pilih periode leaderboard (default: All Time)")
        .setRequired(false)
        .addChoices(
          { name: "All Time", value: "alltime" },
          { name: "7 Hari Terakhir", value: "7days" },
          { name: "30 Hari Terakhir", value: "30days" },
          { name: "Bulan Ini", value: "thismonth" },
          { name: "Custom (isi date_start & date_end)", value: "custom" }
        )
    )
    .addStringOption(option =>
      option
        .setName("date_start")
        .setDescription("Tanggal mulai custom (format: YYYY-MM-DD)")
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName("date_end")
        .setDescription("Tanggal akhir custom (format: YYYY-MM-DD)")
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName("limit")
        .setDescription("Jumlah pemain yang ditampilkan (default: 10, max: 25)")
        .setMinValue(5)
        .setMaxValue(25)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const limit = interaction.options.getInteger("limit") || 10;
    const period = interaction.options.getString("period") || "alltime";
    const dateStart = interaction.options.getString("date_start");
    const dateEnd = interaction.options.getString("date_end");

    if (period === "custom") {
      if (!dateStart || !dateEnd) {
        return interaction.editReply({
          embeds: [errorEmbed("Missing Date Input", "Untuk period **Custom**, kamu harus mengisi `date_start` dan `date_end`.")],
          ephemeral: true,
        });
      }
      if (!isValidDate(dateStart) || !isValidDate(dateEnd)) {
        return interaction.editReply({
          embeds: [errorEmbed("Invalid Date Format", "Format tanggal tidak valid. Gunakan format `YYYY-MM-DD` (contoh: `2025-01-15`).")],
          ephemeral: true,
        });
      }
      if (new Date(dateStart) > new Date(dateEnd)) {
        return interaction.editReply({
          embeds: [errorEmbed("Invalid Date Range", "`date_start` tidak boleh lebih besar dari `date_end`.")],
          ephemeral: true,
        });
      }
    }

    try {
      const { start, end, label } = getDateRange(period, dateStart, dateEnd);

      // ── ALL TIME: query DB langsung, auto-edit embed setiap 1 jam ──────────
      if (period === "alltime") {
        const embed = await buildAlltimeEmbed(limit);

        if (!embed) {
          return interaction.editReply({
            embeds: [errorEmbed("No Data Found", "Tidak ada data playtime yang ditemukan.")],
            ephemeral: true,
          });
        }

        // Kirim embed pertama kali
        const message = await interaction.editReply({ embeds: [embed] });

        // Hapus interval lama kalau ada (misal user spam command)
        if (activeIntervals.has(message.id)) {
          clearInterval(activeIntervals.get(message.id));
        }

        // Auto-edit setiap 1 jam
        const interval = setInterval(async () => {
          try {
            const updatedEmbed = await buildAlltimeEmbed(limit);
            if (updatedEmbed) {
              await message.edit({ embeds: [updatedEmbed] });
            }
          } catch (err) {
            // Message sudah dihapus atau tidak bisa diedit, hentikan interval
            clearInterval(activeIntervals.get(message.id));
            activeIntervals.delete(message.id);
          }
        }, 60 * 60 * 1000); // 1 jam

        activeIntervals.set(message.id, interval);
        return;
      }

      // ── PERIODE TERTENTU: pakai snapshot ──────────────────────────────────
      const [snapshotCheck] = await pool.execute(
        `SELECT COUNT(DISTINCT snapshot_date) as cnt 
         FROM playtime_snapshots 
         WHERE snapshot_date BETWEEN ? AND ?`,
        [start, end]
      );

      if (snapshotCheck[0].cnt === 0) {
        return interaction.editReply({
          embeds: [errorEmbed("No Snapshot Data", `Belum ada data snapshot untuk periode **${label}**.\nBot mulai menyimpan snapshot harian sejak pertama kali dijalankan. Coba lagi besok!`)],
          ephemeral: true,
        });
      }

      const rows = await fetchPeriodLeaderboard(start, end, limit);

      if (!rows || rows.length === 0) {
        return interaction.editReply({
          embeds: [errorEmbed("No Data Found", `Tidak ada data playtime untuk periode **${label}**.`)],
          ephemeral: true,
        });
      }

      let leaderboard = "";
      rows.forEach((player, index) => {
        const medal = getMedal(index + 1);
        const h = Math.floor(player.gained_seconds / 3600);
        const m = Math.floor((player.gained_seconds % 3600) / 60);
        const s = player.gained_seconds % 60;
        const playtime = formatPlaytime(h, m, s);
        leaderboard += `${medal} **${player.username}** • Lvl ${player.level}\n`;
        leaderboard += `⏱️ \`${playtime}\` di periode ini\n\n`;
      });

      const totalGained = rows.reduce((sum, p) => sum + p.gained_seconds, 0);
      const avgGained = Math.floor(totalGained / rows.length / 3600);

      const fmtDate = (str) => new Date(str).toLocaleDateString("id-ID", {
        day: "2-digit", month: "long", year: "numeric"
      });

      const embed = new EmbedBuilder()
        .setTitle(`Playtime Leaderboard — ${label}`)
        .setDescription(leaderboard)
        .setColor("#4FC3F7")
        .addFields(
          {
            name: "Periode",
            value: `**${fmtDate(start)}** → **${fmtDate(end)}**`,
            inline: false,
          },
          {
            name: "Statistik",
            value: `**Total Players**: ${rows.length}\n**Rata-rata**: ${avgGained}h`,
            inline: true,
          },
          {
            name: "Top Player",
            value: `**${rows[0].username}**\n${formatSecondsToReadable(rows[0].gained_seconds)}`,
            inline: true,
          }
        )
        .setFooter({ text: `Valencia Roleplay • Top ${limit} Players • ${label}` })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error fetching playtime leaderboard:", error);
      await interaction.editReply({
        embeds: [errorEmbed("Internal Error", "Terjadi error saat mengambil data leaderboard.")],
        ephemeral: true,
      });
    }
  },
};