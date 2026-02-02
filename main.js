// ============================================
// FILE: main.js
// ============================================
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");
const deployCommands = require("./functions/deploy-commands");
const { initStickySystem } = require("./sticky");


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration,
  ],
});

client.commands = new Collection();

// Load commands
const commandFolders = fs.readdirSync("./commands");
for (const folder of commandFolders) {
  const folderPath = path.join("./commands", folder);

  // Skip if not a directory
  if (!fs.statSync(folderPath).isDirectory()) continue;

  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Loaded command: ${command.data.name}`);
    }
  }
}

// Load events
const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`✅ Loaded event: ${event.name}`);
}

client.buttons = new Collection();
client.modals = new Collection();

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (file.endsWith(".js")) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Load buttons
const buttonFiles = getAllFiles(path.join(__dirname, "buttons"));
for (const file of buttonFiles) {
  const button = require(file);
  if (button.customId && typeof button.execute === "function") {
    client.buttons.set(button.customId, button);
    console.log(`✅ Loaded button: ${button.customId}`);
  }
}

// Load modals
const modalFiles = getAllFiles(path.join(__dirname, "modals"));
for (const file of modalFiles) {
  const modal = require(file);
  if (modal.customId && typeof modal.execute === "function") {
    client.modals.set(modal.customId, modal);
    console.log(`✅ Loaded modal: ${modal.customId}`);
  }
}

// Initialize sticky message system
initStickySystem(client);

// Deploy commands
deployCommands();

// Login
client.login(config.token);