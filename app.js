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

// ----------------- AYARLAR -----------------
const TOKEN = "process.env.TOKEN";
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

client.once("ready", () => {
  console.log(`Bot hazır: ${client.user.tag}`);
});

// ----------------- MESAJ CREATE -----------------
client.on("messageCreate", async message => {
  if (message.author.bot) return;
  const content = message.content.trim().toLowerCase();

  if (content === "track") {
    await message.channel.send("https://lols.gg/en/name/tracker/");
    return message.channel.send(
      "Profili arattıktan sonra **sağ alt köşeden PUUID'yi kopyala** ve **Discord chatine yapıştır**."
    );
  }

  if (content === "profiles") {
    const userProfiles = profiles[message.author.id];
    if (!userProfiles || userProfiles.length === 0)
      return message.channel.send("Kayıtlı profil yok.");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("profile_select")
      .setPlaceholder("Profil seç")
      .addOptions(
        userProfiles.map(p => ({
          label: p.name.length > 100 ? p.name.slice(0, 97) + "..." : p.name,
          value: p.name
        }))
      );

    return message.channel.send({
      content: "Profil seç:",
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }

  if (content === "delete profile") {
    const userProfiles = profiles[message.author.id];
    if (!userProfiles || userProfiles.length === 0)
      return message.channel.send("Silinecek profil yok.");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("delete_profile_select")
      .setPlaceholder("Silinecek profili seç")
      .addOptions(
        userProfiles.map(p => ({
          label: p.name.length > 100 ? p.name.slice(0, 97) + "..." : p.name,
          value: p.name
        }))
      );

    return message.channel.send({
      content: "Silmek istediğiniz profili seçin:",
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }

  if (content.startsWith("delete ")) {
    const parts = content.split(" ");
    const amount = parseInt(parts[1]);
    const unit = parts[2];

    if (isNaN(amount)) return;

    let ms = 0;
    if (unit.startsWith("dak")) ms = amount * 60 * 1000;
    else if (unit.startsWith("saa")) ms = amount * 60 * 60 * 1000;
    else if (unit.startsWith("gün")) ms = amount * 24 * 60 * 60 * 1000;
    else return;

    const now = Date.now();
    const fetched = await message.channel.messages.fetch({ limit: 100 });
    const toDelete = fetched.filter(m => now - m.createdTimestamp <= ms);

    await message.channel.bulkDelete(toDelete, true);
    return message.channel.send(`Son **${amount} ${unit}** içindeki mesajlar silindi.`);
  }

  if (/^[A-Za-z0-9_-]{78}$/.test(message.content.trim())) {
    const regions = ["TR", "EUW", "NA", "KR", "EUNE", "JP"];
    const menu = new StringSelectMenuBuilder()
      .setCustomId("region_select")
      .setPlaceholder("Region seç")
      .addOptions(regions.map(r => ({ label: r, value: r })));

    pendingPUUIDs.set(message.author.id, message.content.trim());
    return message.channel.send({
      content: "Region seç:",
      components: [new ActionRowBuilder().addComponents(menu)]
    });
  }

  if (pendingNames.has(message.author.id)) {
    const { puuid, region } = pendingNames.get(message.author.id);
    const name = message.content.trim();

    if (!profiles[message.author.id]) profiles[message.author.id] = [];
    profiles[message.author.id].push({ name, puuid, region });
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(profiles, null, 2));

    pendingNames.delete(message.author.id);
    return message.channel.send(`Saved. **${name}** artık izleniyor.`);
  }
});

// ----------------- INTERACTION -----------------
client.on("interactionCreate", async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "profile_select") {
    const profile = profiles[interaction.user.id]?.find(
      p => p.name === interaction.values[0]
    );
    if (!profile)
      return interaction.update({ content: "Profil bulunamadı.", components: [] });

    const link = `https://lols.gg/en/name/puuid-tracker/${profile.region.toLowerCase()}/${profile.puuid}`;
    return interaction.update({ content: link, components: [] });
  }

  if (interaction.customId === "delete_profile_select") {
    profiles[interaction.user.id] =
      profiles[interaction.user.id].filter(p => p.name !== interaction.values[0]);

    fs.writeFileSync(PROFILE_FILE, JSON.stringify(profiles, null, 2));
    return interaction.update({ content: "Profil silindi.", components: [] });
  }

  if (interaction.customId === "region_select") {
    const puuid = pendingPUUIDs.get(interaction.user.id);
    pendingPUUIDs.delete(interaction.user.id);
    pendingNames.set(interaction.user.id, {
      puuid,
      region: interaction.values[0]
    });
    return interaction.update({ content: "Profil ismi ne olsun?", components: [] });
  }
});

// ----------------- MESSAGE DELETE (TEK) -----------------
client.on("messageDelete", async message => {
  if (!message.guild) return;

  const embed = new EmbedBuilder()
    .setTitle("Mesaj Silindi")
    .addFields(
      { name: "Yazar", value: message.author?.tag || "Bilinmiyor" },
      { name: "Kanal", value: message.channel?.name || "?" },
      { name: "Mesaj", value: message.content || "[İçerik yok]" }
    )
    .setColor("Red")
    .setTimestamp();

  let targetChannel;

  if (message.guild.id === MAIN_GUILD_ID) {
    targetChannel = message.guild.channels.cache.find(
      c => c.name === TRASH_CHANNEL_NAME
    );
  } else {
    const mainGuild = await client.guilds.fetch(MAIN_GUILD_ID);
    targetChannel = mainGuild.channels.cache.find(
      c => c.name === LOG_CHANNEL_NAME
    );
  }

  if (targetChannel) targetChannel.send({ embeds: [embed] });
});

// ----------------- MESSAGE DELETE BULK -----------------
client.on("messageDeleteBulk", async messages => {
  const guild = messages.first()?.guild;
  if (!guild) return;

  const embed = new EmbedBuilder()
    .setTitle("Toplu Mesaj Silindi")
    .setDescription(`**${messages.size}** mesaj silindi.`)
    .setColor("DarkRed")
    .setTimestamp();

  let targetChannel;

  if (guild.id === MAIN_GUILD_ID) {
    targetChannel = guild.channels.cache.find(c => c.name === TRASH_CHANNEL_NAME);
  } else {
    const mainGuild = await client.guilds.fetch(MAIN_GUILD_ID);
    targetChannel = mainGuild.channels.cache.find(c => c.name === LOG_CHANNEL_NAME);
  }

  if (targetChannel) targetChannel.send({ embeds: [embed] });
});

client.login(TOKEN);
