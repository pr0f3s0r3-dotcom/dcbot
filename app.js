const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ChannelType,
  Partials
} = require("discord.js");
const fs = require("fs");
require('dotenv').config(); // <- Bu satır .env'i okur
console.log("TOKEN:", process.env.TOKEN);
const express = require("express"); // <- HTTP server için ekledik

// ----------------- AYARLAR -----------------
const TOKEN = process.env.TOKEN; // <- Token buradan geliyor
const PROFILE_FILE = "./profiles.json";
const DELETED_FILE = "./deletedMessages.json";
const MAIN_GUILD_ID = "1403132624473428029";
const TRASH_CHANNEL_NAME = "çöp-kutusu";
const LOG_CHANNEL_NAME = "silinen-mesaj-log";

// ----------------- DOSYALARI YÜKLE -----------------
let profiles = fs.existsSync(PROFILE_FILE)
  ? JSON.parse(fs.readFileSync(PROFILE_FILE))
  : {};

let deletedMessages = fs.existsSync(DELETED_FILE)
  ? JSON.parse(fs.readFileSync(DELETED_FILE))
  : {};

const pendingPUUIDs = new Map();
const pendingNames = new Map();

// ----------------- HTTP SERVER (Render için) -----------------
const app = express();
app.get("/", (req, res) => res.send("Bot alive"));
app.listen(process.env.PORT || 3000);

// ----------------- CLIENT -----------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember
  ]
});

// ... buradan itibaren kodun tüm mesaj/interaction/delete eventleri aynı kalıyor

client.once("ready", () => {
  console.log(`Bot hazır: ${client.user.tag}`);
});

// ----------------- MESAJ CREATE -----------------
// Kod burada senin verdiğin gibi devam ediyor (hiç değiştirmedik)

// ----------------- INTERACTION -----------------
// Kod burada aynı şekilde devam ediyor

// ----------------- MESSAGE DELETE -----------------
// Kod burada aynı şekilde devam ediyor

// ----------------- LOGIN -----------------
client.login(TOKEN);
