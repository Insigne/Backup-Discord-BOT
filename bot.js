const { Client, Collection } = require("discord.js");
const { token } = require("./assets/config.json");
const errorHandler = require("./assets/handlers/error.js");

const bot = new Client({
    disabledEvents: ["RELATIONSHIP_ADD", "RELATIONSHIP_REMOVE", "TYPING_START"],
    disableMentions: "everyone",
    messageCacheMaxSize: 150,
    messageCacheLifetime: 240,
    messageSweepInterval: 300,
});

["commands","aliases", "usage"].forEach(x => bot[x] = new Collection());
["command", "event"].forEach(x => require(`./assets/handlers/${x}`)(bot));

bot.on("shardDisconnect", () => errorHandler.disconnect())
    .on("reconnecting", () => errorHandler.reconnecting())
    .on("warn", err => errorHandler.warn(err))
    .on("error", err => errorHandler.error(err))
    .on("DiscordAPIError", err => errorHandler.DiscordAPIError(err));

process.on("uncaughtException", err => errorHandler.unhandledRejection(err));
process.on("unhandledRejection", (err) => errorHandler.unhandledRejection(err));

bot.login(token);