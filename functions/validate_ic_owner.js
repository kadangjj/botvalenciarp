const { pool } = require("./database");

async function validateICOwner(DiscordID, characterName) {
  try {
    // 1. Cari UCP berdasarkan DiscordID
    const [ucpRows] = await pool.query(
      "SELECT ucp FROM playerucp WHERE DiscordID = ?",
      [DiscordID]
    );

    if (ucpRows.length === 0) {
      console.error("Discord ID tidak ditemukan di tabel UCP");
      return false;
    }

    const ucpName = ucpRows[0].ucp; // Perbaikan: gunakan field 'ucp'

    // 2. Validasi apakah karakter milik UCP tersebut
    const [playerRows] = await pool.execute(
      "SELECT username FROM players WHERE ucp = ? AND username = ?",
      [ucpName, characterName]
    );

    // Perbaikan: cek length array, bukan property count
    if (playerRows.length === 0) {
      console.error(
        `Nama karakter '${characterName}' tidak ditemukan untuk UCP '${ucpName}'`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in validateICOwner:", error);
    return false;
  }
}

module.exports = { validateICOwner };