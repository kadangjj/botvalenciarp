const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const express = require("express");
const config = require("./config.json");
const deployCommands = require("./functions/deploy-commands");
const { initStickySystem } = require("./sticky");

// ── WEB SERVER ──
const app = express();
const PORT = process.env.PORT || 25565;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── PRICE UPDATE ──
const PRICE_CHANNEL_ID = "1479562103944642591";

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
    txt = parts.join(",");
  }
  const decimalStr = decimalPart.toString().padStart(2, "0");
  txt = `$${txt}.${decimalStr}`;
  return isNegative ? `-${txt}` : txt;
}

const getIndicator = (current, previous) => {
  if (!previous || current === previous) return "⚪";
  return current > previous ? "🔺" : "🔻";
};

const formatPrice = (val) => formatMoney(val);

app.post("/price-update", async (req, res) => {
  try {
    let prices, previousPrices;

    if (typeof req.body === "string") {
      const parsed = JSON.parse(req.body);
      prices = parsed.prices;
      previousPrices = parsed.previousPrices;
    } else if (req.body && req.body.prices) {
      prices = req.body.prices;
      previousPrices = req.body.previousPrices;
    } else {
      const key = Object.keys(req.body)[0];
      const parsed = JSON.parse(key);
      prices = parsed.prices;
      previousPrices = parsed.previousPrices;
    }

    const fields = [
      { name: "Material",  val: prices.material,  prev: previousPrices.material },
      { name: "Lumber",    val: prices.lumber,     prev: previousPrices.lumber },
      { name: "Metal",     val: prices.metal,      prev: previousPrices.metal },
      { name: "Component", val: prices.component,  prev: previousPrices.component },
      { name: "GasOil",    val: prices.gasoil,     prev: previousPrices.gasoil },
      { name: "Coal",      val: prices.coal,       prev: previousPrices.coal },
      { name: "Product",   val: prices.product,    prev: previousPrices.product },
      { name: "Medicine",  val: prices.medicine,   prev: previousPrices.medicine },
      { name: "Medkit",    val: prices.medkit,     prev: previousPrices.medkit },
      { name: "Food",      val: prices.food,       prev: previousPrices.food },
      { name: "Seed",      val: prices.seed,       prev: previousPrices.seed },
      { name: "Potato",    val: prices.potato,     prev: previousPrices.potato },
      { name: "Wheat",     val: prices.wheat,      prev: previousPrices.wheat },
      { name: "Orange",    val: prices.orange,     prev: previousPrices.orange },
      { name: "Marijuana", val: prices.marijuana,  prev: previousPrices.marijuana },
      { name: "Fish",      val: prices.fish,       prev: previousPrices.fish },
      { name: "Meat",      val: prices.meat,       prev: previousPrices.meat },
      { name: "GStation",  val: prices.gstation,   prev: previousPrices.gstation },
      { name: "Obat",      val: prices.obat,       prev: previousPrices.obat },
    ];

   const priceList = fields
  .map((f, i) => {
    const num = i + 1 < 10 ? `\u00a0${i + 1}` : `${i + 1}`;
    const name = f.name.padEnd(12, " ");
    const indicator = getIndicator(f.val, f.prev);
    const price = formatPrice(f.val);
  	return `**${num}.** ${f.name} ${getIndicator(f.val, f.prev)} — \`${formatPrice(f.val)}\``;
  })
  .join("\n");

const channel = await client.channels.fetch(PRICE_CHANNEL_ID);
    await channel.send({
      embeds: [
        {
          title: "💰 Price List Updated (12 hours)",
          color: 0xf5a623,
          description:
            "**Harga jual barang periode baru!**\n" +
            "Cek list di bawah:\n\n" +
  			priceList +
            "\n\n**Keterangan**\n🔺 Naik • 🔻 Turun • ⚪ Stabil",
          timestamp: new Date().toISOString(),
          footer: { text: "Rotate Price" },
        },
      ],
    });

    console.log(`[Price] Sent to Discord`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[Price] Error:", err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ── BOT SETUP ──
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
  if (!fs.statSync(folderPath).isDirectory()) continue;
  const commandFiles = fs
    .readdirSync(`./commands/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
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
  console.log(`Loaded event: ${event.name}`);
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
    console.log(`Loaded button: ${button.customId}`);
  }
}

// Load modals
const modalFiles = getAllFiles(path.join(__dirname, "modals"));
for (const file of modalFiles) {
  const modal = require(file);
  if (modal.customId && typeof modal.execute === "function") {
    client.modals.set(modal.customId, modal);
    console.log(`Loaded modal: ${modal.customId}`);
  }
}

// Initialize sticky message system
initStickySystem(client);

// Deploy commands
deployCommands();

// Login
client.login(config.token);