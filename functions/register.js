const mysql = require("mysql2/promise");
const config = require("../config.json");

const pool = mysql.createPool(config.database);

async function isUserRegistered(DiscordID) {
  const [rows] = await pool.query("SELECT * FROM playerucp WHERE DiscordID = ?", [
    DiscordID,
  ]);
  return rows.length > 0;
}

async function insertUser(ucpName, DiscordID, verifycode, email) {
  try {
    const [result] = await pool.query(
      "INSERT INTO playerucp (ucp, DiscordID, verifycode, email) VALUES (?, ?, ?, ?)",
      [ucpName, DiscordID, verifycode, email]
    );
    return result.affectedRows > 0;
  } catch (err) {
    console.error(err);
    return false;
  }
}

function generatePin() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

module.exports = { isUserRegistered, insertUser, generatePin };