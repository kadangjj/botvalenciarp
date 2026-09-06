const { pool } = require("./database");

const CACHE_UPDATE_INTERVAL = 60 * 60 * 1000; // 1 jam

let leaderboardCache = null;
let hourlySnapshots = [];
const MAX_SNAPSHOTS = 168; // 7 hari

// ─── Snapshot harian ke DB ───────────────────────────────────────────────────
async function takeDailySnapshot() {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Cek apakah snapshot hari ini sudah ada
    const [existing] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM playtime_snapshots WHERE snapshot_date = ?`,
      [today]
    );

    if (existing[0].cnt > 0) {
      console.log(`[PlaytimeCache] Snapshot ${today} sudah ada, skip.`);
      return;
    }

    // Ambil semua players yang punya playtime
    const [players] = await pool.execute(
      `SELECT username, (hours * 3600 + minutes * 60 + seconds) AS total_seconds
       FROM players
       WHERE hours > 0 OR minutes > 0 OR seconds > 0`
    );

    if (players.length === 0) return;

    // Insert snapshot batch
    const values = players.map(p => [p.username, p.total_seconds, today]);
    await pool.query(
      `INSERT IGNORE INTO playtime_snapshots (username, total_seconds, snapshot_date)
       VALUES ?`,
      [values]
    );

    console.log(`[PlaytimeCache] Snapshot harian ${today} disimpan. ${players.length} players.`);
  } catch (error) {
    console.error("[PlaytimeCache] Gagal menyimpan snapshot harian:", error);
  }
}

// Jadwalkan snapshot setiap hari jam 00:00
function scheduleDailySnapshot() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);

  const msUntilMidnight = nextMidnight.getTime() - now.getTime();

  setTimeout(() => {
    takeDailySnapshot();
    setInterval(takeDailySnapshot, 24 * 60 * 60 * 1000); // ulangi setiap 24 jam
  }, msUntilMidnight);

  console.log(
    `[PlaytimeCache] Snapshot harian dijadwalkan. Berikutnya: ${nextMidnight.toLocaleString("id-ID")}`
  );
}

// ─── Cache leaderboard (update setiap 1 jam) ────────────────────────────────
async function fetchAndUpdateCache() {
  try {
    console.log("[PlaytimeCache] Updating leaderboard cache...");

    const [players] = await pool.execute(
      `SELECT 
        username, level, hours, minutes, seconds,
        (hours * 3600 + minutes * 60 + seconds) AS total_seconds
       FROM players
       WHERE hours > 0 OR minutes > 0 OR seconds > 0
       ORDER BY total_seconds DESC
       LIMIT 25`
    );

    const [snapshot] = await pool.execute(
      `SELECT COUNT(*) AS active_players,
              SUM(hours * 3600 + minutes * 60 + seconds) AS total_seconds
       FROM players
       WHERE hours > 0 OR minutes > 0 OR seconds > 0`
    );

    const now = new Date();
    const label = now.toLocaleString("id-ID", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });

    if (snapshot[0]) {
      hourlySnapshots.push({
        label,
        timestamp: now,
        totalSeconds: parseInt(snapshot[0].total_seconds) || 0,
        activePlayers: parseInt(snapshot[0].active_players) || 0,
      });
      if (hourlySnapshots.length > MAX_SNAPSHOTS) hourlySnapshots.shift();
    }

    const peakPeriod = hourlySnapshots.length > 0
      ? hourlySnapshots.reduce((max, snap) => snap.totalSeconds > max.totalSeconds ? snap : max)
      : null;

    leaderboardCache = { players, peakPeriod, lastUpdated: now };

    console.log(`[PlaytimeCache] Cache updated. ${players.length} players.`);
  } catch (error) {
    console.error("[PlaytimeCache] Gagal update cache:", error);
  }
}

function getLeaderboardCache() {
  return leaderboardCache;
}

function startCacheUpdater() {
  fetchAndUpdateCache();
  setInterval(fetchAndUpdateCache, CACHE_UPDATE_INTERVAL);
  takeDailySnapshot();      // snapshot langsung saat bot start (kalau belum ada hari ini)
  scheduleDailySnapshot();  // jadwalkan berikutnya tiap midnight
  console.log("[PlaytimeCache] Cache updater started.");
}

module.exports = {
  getLeaderboardCache,
  startCacheUpdater,
  CACHE_UPDATE_INTERVAL,
};