const { EmbedBuilder } = require("discord.js");
const dgram = require("dgram");
const config = require("../config.json");

const CHANNEL_ID = config.channels.serverstats;
const SERVER_IP = config.server.serverIP || "34.101.59.153";
const SERVER_PORT = parseInt(config.server.serverPort) || 7777;

let embedMessage = null;
let lastServerData = null;

// ─── SA-MP Query (tanpa API eksternal) ───────────────────────────────────────
function querySAMP(ip, port, timeout = 5000) {
  return new Promise((resolve) => {
    const socket = dgram.createSocket("udp4");
    let resolved = false;

    const fallback = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        socket.close();
        resolve({ online: false });
      }
    }, timeout);

    // Build SA-MP query packet
    const ipParts = ip.split(".").map(Number);
    const portLow = port & 0xff;
    const portHigh = (port >> 8) & 0xff;

    const packet = Buffer.alloc(11);
    packet.write("SAMP", 0, "ascii");
    packet[4] = ipParts[0];
    packet[5] = ipParts[1];
    packet[6] = ipParts[2];
    packet[7] = ipParts[3];
    packet[8] = portLow;
    packet[9] = portHigh;
    packet[10] = 0x69; // 'i' = info

    socket.on("message", (msg) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(fallback);
      socket.close();

      try {
        // Parse SA-MP info response
        // Offset 11: password(1), players(2), maxplayers(2), hostnameLen(4)+hostname, gamemodeLen(4)+gamemode, langLen(4)+lang
        let offset = 11;

        const password = msg[offset++] === 1;
        const players = msg.readUInt16LE(offset); offset += 2;
        const maxPlayers = msg.readUInt16LE(offset); offset += 2;

        const hostnameLen = msg.readUInt32LE(offset); offset += 4;
        const hostname = msg.toString("ascii", offset, offset + hostnameLen); offset += hostnameLen;

        const gamemodeLen = msg.readUInt32LE(offset); offset += 4;
        const gamemode = msg.toString("ascii", offset, offset + gamemodeLen); offset += gamemodeLen;

        const langLen = msg.readUInt32LE(offset); offset += 4;
        const language = msg.toString("ascii", offset, offset + langLen);

        resolve({ online: true, password, players, maxPlayers, hostname, gamemode, language });
      } catch (e) {
        resolve({ online: false });
      }
    });

    socket.on("error", () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(fallback);
        socket.close();
        resolve({ online: false });
      }
    });

    socket.send(packet, 0, packet.length, port, ip);
  });
}

// ─── Check & format server status ────────────────────────────────────────────
async function checkServerStatus() {
  const data = await querySAMP(SERVER_IP, SERVER_PORT);

  if (!data.online) {
    return {
      status: "🔴 OFFLINE",
      players: "0/0",
      language: "N/A",
      gamemode: "N/A",
      hostname: "Valencia Roleplay",
    };
  }

  if (data.password) {
    return {
      status: "🟡 MAINTENANCE",
      players: `${data.players}/${data.maxPlayers}`,
      language: data.language || "Indonesian",
      gamemode: data.gamemode || "Roleplay",
      hostname: data.hostname || "Valencia Roleplay",
    };
  }

  return {
    status: "🟢 ONLINE",
    players: `${data.players}/${data.maxPlayers}`,
    language: data.language || "Indonesian",
    gamemode: data.gamemode || "Roleplay",
    hostname: data.hostname || "Valencia Roleplay",
  };
}

// ─── Build & send/edit embed ──────────────────────────────────────────────────
async function updateEmbed(client) {
  try {
    const serverData = await checkServerStatus();

    const dataChanged = JSON.stringify(lastServerData) !== JSON.stringify(serverData);
    if (!dataChanged && embedMessage) return;
    lastServerData = { ...serverData };

    const embed = new EmbedBuilder()
      .setColor(
        serverData.status === "🟢 ONLINE"
          ? 0x00ff00
          : serverData.status === "🟡 MAINTENANCE"
          ? 0xffff00
          : 0xff0000
      )
      .setTitle("Valencia Roleplay Server Status")
      .setURL("https://valenciaroleplay.id")
      .addFields(
        { name: "> STATUS",  value: `\`\`\`${serverData.status}\`\`\``, inline: true },
        { name: "> PLAYERS", value: `\`\`\`${serverData.players}\`\`\``, inline: true },
        { name: "\u200B", value: "\u200B", inline: true },
        { name: "> CONNECT",  value: `\`\`\`${SERVER_IP}:${SERVER_PORT}\`\`\``, inline: false },
        { name: "> LANGUAGE", value: `\`\`\`${serverData.language}\`\`\``, inline: true },
        { name: "> GAMEMODE", value: `\`\`\`${serverData.gamemode}\`\`\``, inline: true }
      )
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg"
      )
      .setImage(
        "https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg"
      )
      .setFooter({
        text: `Last Update: ${new Date().toLocaleString("id-ID", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        })} WIB`,
        iconURL:
          "https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg",
      })
      .setTimestamp();

    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!embedMessage) {
      const messages = await channel.messages.fetch({ limit: 20 });
      embedMessage = messages.find(
        (msg) => msg.author.id === client.user.id && msg.embeds.length > 0
      );
    }

    if (!embedMessage) {
      embedMessage = await channel.send({ embeds: [embed] });
    } else {
      await embedMessage.edit({ embeds: [embed] });
    }

  } catch (error) {
    console.error("❌ Error updating embed:", error);
  }
}

// ─── Auto update ──────────────────────────────────────────────────────────────
function startAutoUpdate(client) {
  console.log("🚀 Starting auto update for server status (direct SA-MP query)...");
  updateEmbed(client);
  setInterval(() => updateEmbed(client), 10000); // update setiap 10 detik
}

module.exports = { updateEmbed, startAutoUpdate };