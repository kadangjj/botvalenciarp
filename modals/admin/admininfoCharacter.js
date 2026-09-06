const { EmbedBuilder } = require("discord.js");
const { pool } = require("../../functions/database");
const config = require("../../config.json");

function formatMoney(amount) {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const integerPart = Math.floor(absAmount / 100);
  const decimalPart = Math.floor(absAmount % 100);
  let txt = integerPart.toString();
  const l = txt.length;
  if (l > 3) {
    const parts = [];
    let remaining = txt;
    while (remaining.length > 3) {
      parts.unshift(remaining.slice(-3));
      remaining = remaining.slice(0, -3);
    }
    if (remaining.length > 0) parts.unshift(remaining);
    txt = parts.join(',');
  }
  const decimalStr = decimalPart.toString().padStart(2, '0');
  txt = `${txt}.${decimalStr}`;
  return isNegative ? `-${txt}` : txt;
}

module.exports = {
  customId: "characterInfoModal",
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.roles.adminRole)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Akses Ditolak")
            .setDescription("Anda tidak memiliki izin untuk mengakses fitur ini!")
        ],
        ephemeral: true,
      });
    }

    const characterName = interaction.fields.getTextInputValue("characterName").replace(/\s+/g, "_");

    try {
      const [characterData] = await pool.execute(
        "SELECT * FROM players WHERE username = ?",
        [characterName]
      );

      if (characterData.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(0xFF0000)
              .setTitle("Data Not Found")
              .setDescription("Karakter yang diminta tidak ditemukan di database.")
          ],
          ephemeral: true,
        });
      }

      const char = characterData[0];
      const characterNameDisplay = char.username || "Nama tidak tersedia";

      const vipLevels = ["Not VIP", "Bronze", "Silver", "Diamond"];
      const vipStatus = vipLevels[char.vip] || "Not VIP";

      const jobNames = {
        1: "Taxi Driver",
        2: "Mechanic",
        3: "Lumberjack",
        4: "Trucker",
        5: "Miner",
        6: "Production",
        7: "Farmer",
        8: "Courier",
        9: "Smuggler",
        10: "Baggager",
      };
      const jobTitle = jobNames[char.job] || "Unknown Job";

      const factionNames = {
        1: "San Andreas Police Department",
        2: "San Andreas Government",
        3: "San Andreas Medical Department",
        4: "San Andreas News Network",
      };
      const factionTitle = factionNames[char.faction] || "Unknown Faction";

      const characterInfoEmbed = new EmbedBuilder()
        .setTitle(`📋 ${characterNameDisplay}`)
        .setColor("#0D6EFD")
        .setDescription(`
**Level**: ${char.level}
**Gender**: ${char.gender === 1 ? "Male" : "Female"}
**Birthdate**: ${char.age}
**Status Admin**: ${char.admin === 0 ? "No Admin" : "Administrator"}
**Registration Date**: ${new Date(char.reg_date).toLocaleDateString('id-ID')}
**Last Login**: ${new Date(char.last_login).toLocaleString('id-ID')}
**Playtime**: ${char.hours}j ${char.minutes}m ${char.seconds}d
**Balance**: $${formatMoney(char.money)}
**Bank**: $${formatMoney(char.bmoney || 0)}
**VIP**: ${vipStatus}
**VIP Expiry**: ${char.vip === 0 ? "Tidak VIP" : new Date(char.vip_time).toLocaleDateString('id-ID')}
**Hungry**: ${char.hunger || 0}%
**Thirsty**: ${char.energy || 0}%
**Faction**: ${factionTitle}
**Job**: ${jobTitle}
        `)
        .setFooter({ text: "Informasi Karakter" })
        .setTimestamp();

      const skinImageUrl = `https://assets.open.mp/assets/images/skins/${char.skin}.png`;
      characterInfoEmbed.setThumbnail(skinImageUrl);

      await interaction.reply({
        embeds: [characterInfoEmbed],
        ephemeral: true,
      });

    } catch (error) {
      console.error(error);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("Error")
            .setDescription("Terjadi kesalahan saat mengambil informasi karakter.")
        ],
        ephemeral: true,
      });
    }
  },
};