const { pool } = require("./database");

async function getUserData(DiscordID) {
  const query =
    "SELECT ucp, verifycode FROM playerucp WHERE DiscordID = ?";
  const [rows] = await pool.execute(query, [DiscordID]);
  return rows[0] || null;
}

async function getUserCharacters(ucpName) {
  if (!ucpName) {
    throw new Error("UCP Name tidak ditemukan.");
  }

  const query = "SELECT username FROM players WHERE ucp = ?";
  const [rows] = await pool.execute(query, [ucpName]);

  return rows.map((row) => row.username);
}

async function deleteAccountByDiscordID(DiscordID) {
  const query = "DELETE FROM playerucp WHERE DiscordID = ?";
  const [result] = await pool.execute(query, [DiscordID]);
  return result.affectedRows > 0;
}

module.exports = { getUserData, getUserCharacters, deleteAccountByDiscordID };
