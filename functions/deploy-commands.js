const { REST, Routes } = require("discord.js");
const fs = require("fs");
const config = require("../config.json");

async function deployCommands() {
  const commands = [];
  const commandFolders = fs.readdirSync("./commands");

  for (const folder of commandFolders) {
    const commandFiles = fs
      .readdirSync(`./commands/${folder}`)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      try {
        const command = require(`../commands/${folder}/${file}`);
        if (command.data && typeof command.data.toJSON === "function") {
          commands.push(command.data.toJSON());
        } else {
          console.warn(`Command in ${folder}/${file} is invalid.`);
        }
      } catch (error) {
        console.error(`Error loading command ${folder}/${file}:`, error);
      }
    }
  }

  const rest = new REST({ version: "10" }).setToken(config.token);

  try {
    console.log(
      "Started refreshing application (/) commands for a specific guild."
    );

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log(
      "Successfully reloaded application (/) commands for the guild."
    );
  } catch (error) {
    console.error("Error deploying commands:", error);
  }
}

module.exports = deployCommands;
