const { monitorServerStatus } = require("../functions/server-status");
const { startAutoUpdate } = require("../functions/connect");
const { startLeaderboardUpdate } = require("../functions/leaderboard");

module.exports = {
  name: "clientReady",
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity("Author by Yellowcrush");

    //setInterval(() => monitorServerStatus(client), 2000); //ini system status server on/off/mt, hilangi tanda // diawal jika mau diaktifkan.
    startAutoUpdate(client); //server statistic
    //startLeaderboardUpdate(client); //leaderboard
  },
};
