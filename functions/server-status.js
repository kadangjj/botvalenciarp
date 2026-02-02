const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");
const samp = require("samp-query");
const fs = require("fs");
const path = require("path");

const serverIP = config.server.serverIP;
const serverPort = config.server.serverPort;
const statusFilePath = path.join(__dirname, "../data/lastStatus.json");

let isChecking = false;

// Membaca status terakhir dari file
function getLastStatusFromFile() {
  if (fs.existsSync(statusFilePath)) {
    try {
      const data = fs.readFileSync(statusFilePath, "utf8");
      return JSON.parse(data).status;
    } catch (error) {
      console.error("Error reading last status file:", error);
      return null;
    }
  }
  return null;
}

// Menyimpan status terbaru ke file
function saveLastStatusToFile(status) {
  try {
    fs.writeFileSync(
      statusFilePath,
      JSON.stringify({ status }, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error saving last status to file:", error);
  }
}

async function checkServerStatus() {
  return new Promise((resolve) => {
    const options = {
      host: serverIP,
      port: serverPort,
      timeout: 1000,
    };

    samp(options, (error, response) => {
      if (error) {
        resolve({ status: "offline" });
      } else if (response.passworded) {
        resolve({ status: "maintenance" }); // Jika server terkunci
      } else {
        resolve({ status: "online" }); // Jika server online
      }
    });
  });
}

async function logStatusChange(client, status) {
  const embed = new EmbedBuilder()
    .setColor(
      status === "online"
        ? "#00FF00"
        : status === "offline"
        ? "#FF0000"
        : "#FFFF00"
    )
    .setTitle("**ANNOUNCEMENT**")
    .setDescription(getStatusDescription(status))
    .setThumbnail(config.server.logo) // Menggunakan logo dari config.json
    .setTimestamp()
    .setFooter({ text: "Valencia Roleplay | Still High" }); // Footer dari config.json

  const channel = await client.channels.fetch(config.channels.serverstatus);
  if (channel) await channel.send({ embeds: [embed] });
}

function getStatusDescription(status) {
  switch (status) {
    case "online":
      return "```SERVER GATE IS OPEN!\nPLAYERS CAN NOW ENTER THE SERVER.\nALWAYS READ THE RULES PROVIDED\nENJOY ROLE PLAYING```";
    case "offline":
      return "```THE SERVER GATE HAS BEEN CLOSED!\nWAIT FOR A MOMENT UNTIL THE SERVER IS BACK ONLINE\nPLEASE READ THE SERVER INFORMATION TO FIND OUT MORE INFORMATION```";
    case "maintenance":
      return "```SERVER UNDER MAINTENANCE!\nREAD THE LATEST INFORMATION TO FIND OUT MAINTENANCE COMPLETION TIME\nWAIT SOME TIME UNTIL THE MAINTENANCE IS COMPLETE```";
    default:
      return "ℹ️ **Server status is currently unknown.**";
  }
}

async function monitorServerStatus(client) {
  if (isChecking) return;
  isChecking = true;

  try {
    const currentStatus = await checkServerStatus();
    const lastStatus = getLastStatusFromFile();

    if (currentStatus.status !== lastStatus) {
      await logStatusChange(client, currentStatus.status);
      saveLastStatusToFile(currentStatus.status);
    }
  } catch (error) {
    console.error("Error checking server status:", error);
  } finally {
    isChecking = false;
  }
}

module.exports = { monitorServerStatus };
