const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const config = require("../config.json");

const CHANNEL_ID = config.channels.serverstats;
const SERVER_IP = config.server.serverIP;
const SERVER_PORT = config.server.serverPort;

let embedMessage = null;
let lastServerData = null;

async function checkServerStatus() {
  try {
    const url = `https://sam.markski.ar/api/GetServerByIP?ip_addr=${SERVER_IP}:${SERVER_PORT}`;
    const response = await axios.get(url);
    
    const serverData = response.data;
    
    // Cek apakah response berisi data server yang valid
    if (!serverData || !serverData.ipAddr) {
      console.log('Server offline - no valid data');
      return {
        status: "🔴 OFFLINE",
        players: "N/A",
        maxPlayers: "N/A",
        uptime: "N/A",
        language: "N/A",
        gamemode: "N/A",
      };
    }

    // Cek apakah server membutuhkan password (maintenance)
    if (serverData.requiresPassword === true) {
      return {
        status: "🟡 MAINTENANCE",
        players: `${serverData.playersOnline}/${serverData.maxPlayers}`,
        maxPlayers: serverData.maxPlayers,
        language: serverData.language || "Unknown",
        gamemode: serverData.gameMode || "Unknown",
      };
    }

    // Server online
    const isOnline = serverData.name && serverData.maxPlayers !== undefined;
    
    return {
      status: isOnline ? "🟢 ONLINE" : "🔴 OFFLINE",
      players: `${serverData.playersOnline}/${serverData.maxPlayers}`,
      maxPlayers: serverData.maxPlayers,
      language: serverData.language || "Unknown",
      gamemode: serverData.gameMode || "Unknown",
    };
  } catch (error) {
    console.error("Error fetching server status:", error.message);
    return {
      status: "🔴 OFFLINE",
      players: "N/A",
      maxPlayers: "N/A",
      uptime: "N/A",
      language: "N/A",
      gamemode: "N/A",
    };
  }
}

async function updateEmbed(client) {
  try {
    const serverData = await checkServerStatus();
 
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
        {
          name: "> STATUS",
          value: `\`\`\`${serverData.status}\`\`\``,
          inline: true,
        },
        {
          name: "> PLAYERS",
          value: `\`\`\`${serverData.players}\`\`\``,
          inline: true,
        },
        { name: "\u200B", value: "\u200B", inline: true },
        {
          name: "> CONNECT",
          value: `\`\`\`${SERVER_IP}:${SERVER_PORT}\`\`\``,
          inline: false,
        },
        {
          name: "> LANGUAGE",
          value: `\`\`\`${serverData.language}\`\`\``,
          inline: true,
        },
        {
          name: "> GAMEMODE",
          value: `\`\`\`${serverData.gamemode}\`\`\``,
          inline: true,
        }
      )
      .setThumbnail(
        `https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg?ex=692bc8a4&is=692a7724&hm=845e78348ccf3761a0aac224cf4061752c697f93d5d61b0f3f197ca11b4f859d&`
      )
      .setImage(
        `https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg?ex=692bc8a4&is=692a7724&hm=845e78348ccf3761a0aac224cf4061752c697f93d5d61b0f3f197ca11b4f859d&`
      )
      .setFooter({
        text: "Live Updates Statistic",
        iconURL:
          "https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg?ex=692bc8a4&is=692a7724&hm=845e78348ccf3761a0aac224cf4061752c697f93d5d61b0f3f197ca11b4f859d&",
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

    const messages = await channel.messages.fetch({ limit: 20 });
    const otherMessages = messages.filter((msg) => msg.id !== embedMessage.id);
    otherMessages.forEach(async (msg) => {
      if (msg.author.id === client.user.id) {
        await msg.delete();
      }
    });
  } catch (error) {
    console.error("Error updating embed:", error);
  }
}

function startAutoUpdate(client) {
  updateEmbed(client);
  setInterval(() => {
    updateEmbed(client);
  }, 5000);
}

module.exports = { updateEmbed, startAutoUpdate };