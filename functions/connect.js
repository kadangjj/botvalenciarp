const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const config = require("../config.json");

const CHANNEL_ID = config.channels.serverstats;
const SERVER_IP = config.server.serverIP || "35.198.243.227";
const SERVER_PORT = config.server.serverPort || "7777";
const API_URL = "http://35.198.243.227:6666/api/server-status"; // Ganti dengan VPS IP jika deploy

let embedMessage = null;
let lastServerData = null;

async function checkServerStatus() {
  try {
    const response = await axios.get(API_URL, { 
      timeout: 5000,
      headers: {
        'User-Agent': 'Valencia-Discord-Bot/1.0'
      }
    });
    
    // Log response untuk debug
  //  console.log('API Response:', response.data);
    
    if (!response.data.success) {
     // console.log('❌ Server offline - API returned error');
      return {
        status: "🔴 OFFLINE",
        players: "0/0",
        maxPlayers: 0,
        language: "N/A",
        gamemode: "N/A",
      };
    }

    const data = response.data.data;
    
   
    
    // Cek maintenance (password protected)
    if (data.password === true) {
      return {
        status: "🟡 MAINTENANCE",
        players: `${data.players}/${data.maxPlayers}`,
        maxPlayers: data.maxPlayers,
        language: data.language || "Indonesian",
        gamemode: data.gamemode || "Roleplay",
      };
    }

    // Server online
    return {
      status: data.online ? "🟢 ONLINE" : "🔴 OFFLINE",
      players: `${data.players}/${data.maxPlayers}`,
      maxPlayers: data.maxPlayers,
      language: data.language || "Indonesian",
      gamemode: data.gamemode || "Roleplay",
      hostname: data.hostname || "Valencia Roleplay",
      ping: data.ping || 0
    };

  } catch (error) {
    console.error("❌ Error fetching server status:", error.message);
    return {
      status: "🔴 OFFLINE",
      players: "N/A",
      maxPlayers: "N/A",
      language: "N/A",
      gamemode: "N/A",
    };
  }
}

async function updateEmbed(client) {
  try {
    const serverData = await checkServerStatus();
    
    // Debug log dengan timestamp
    const timestamp = new Date().toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    //console.log(`[${timestamp}] ${serverData.status} | Players: ${serverData.players} | Language: ${serverData.language}`);
    
    // Cek apakah data berubah
    const dataChanged = JSON.stringify(lastServerData) !== JSON.stringify(serverData);
    
    if (!dataChanged && embedMessage) {
      //console.log('⏸️  Data tidak berubah, skip update');
      return;
    }
    
    //console.log('📊 Data berubah, updating embed...');
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
        `https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg`
      )
      .setImage(
        `https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg`
      )
      .setFooter({
        text: `Last Update: ${new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit', 
          second: '2-digit',
          hour12: false
        })} WIB`,
        iconURL: "https://cdn.discordapp.com/attachments/1330494882950676579/1444183980994986117/20251128_181111.jpg",
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
     // console.log('✅ Embed message created');
    } else {
      await embedMessage.edit({ embeds: [embed] });
     // console.log('✅ Embed message updated');
    }

  } catch (error) {
    console.error("❌ Error updating embed:", error);
  }
}

function startAutoUpdate(client) {
  console.log('🚀 Starting auto update for server status...');
  updateEmbed(client); // Update pertama kali
  
  setInterval(() => {
    updateEmbed(client);
  }, 900); // Update setiap 3 detik
}

module.exports = { updateEmbed, startAutoUpdate };