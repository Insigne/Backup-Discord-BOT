const { MessageEmbed, Client, Util, Message } = require("discord.js");
const fs = require("fs");
const hastebins = require("hastebin-gen");
const backups = JSON.parse(fs.readFileSync("./assets/backups/backups.json", "utf8"));

module.exports.run = async (bot, message, args) => {
    try {
        if (message.channel.type === "dm") return message.channel.send("no");
        if (message.author.bot) return message.channel.send("no");

        if (args[0] === "create") {
            await message.guild.roles.cache.filter(r => r.name !== message.guild.member(bot.user.id).roles.highest.name).forEach(r => {
                if (r.comparePositionTo(message.guild.member(bot.user.id).roles.highest) > 0) {
                    return message.channel.send("bot does not have the highest role");
                }
            });

            let creatingEmbed = new MessageEmbed()
                .setColor("ORANGE")
                .setTitle(`Please wait...`)
                .setTimestamp()
                .setDescription("Creating backup...");
            message.channel.send(creatingEmbed).then(m => {
                let id = createBackupID(16);
                const channels = message.guild.channels.cache.sort(function(a, b) {
                    return a.position - b.position;
                }).array().map(c => {
                    const channel = {
                        type: c.type,
                        name: c.name,
                        postion: c.position
                    };
                    if (c.parent) channel.parent = c.parent.name;
                    return channel;
                });

                const roles = message.guild.roles.cache.filter(r => r.name !== "@everyone").sort(function(a, b) {
                    return a.position - b.position;
                }).array().map(r => {
                    const role = {
                        name: r.name,
                        color: r.color,
                        hoist: r.hoist,
                        permissions: r.permissions,
                        mentionable: r.mentionable,
                        position: r.position
                    };
                    return role;
                });

                if (!backups[message.author.id]) backups[message.author.id] = {};
                    backups[message.author.id][id] = {
                    icon: message.guild.iconURL(),
                    name: message.guild.name,
                    owner: message.guild.ownerID,
                    members: message.guild.memberCount,
                    createdAt: message.guild.createdAt,
                    roles,
                    channels
                };

                save();

                let result = new MessageEmbed()
                    .setTitle(`Backup finished`)
                    .setDescription(
                    `Created backup of **${message.guild.name}** with the Backup id \`${id}\``
                    )
                    .addField(
                    "Usage",
                    `\`\`\`b!backup load ${id}\`\`\`
                    \`\`\`b!backup info ${id}\`\`\``
                    )
                    .setColor("GREEN");

                message.author.send(result);
                m.edit(result);

                return true;
            });
        } else if (args[0] === "delete") {
            if (!args[1]) return message.channel.send("You forgot to define the backup ID.")
            if (!backups[message.author.id][args[1]]) return message.channel.send("You have no backup with this ID.");

            delete backups[message.author.id][args[1]];
            save();

            let deleted = new MessageEmbed()
                .setTitle(`Backup successfully deleted`)
                .setDescription(`Successfully deleted backup with this ID.`)
                .setColor("GREEN");
            message.channel.send(deleted);
        } else if (args[0] === "load") {
            if (!args[1]) return message.channel.send("You forgot to define the backup ID.")
            if (!backups[message.author.id][args[1]]) return message.channel.send("You have no backup with this ID.");

            message.guild.channels.cache.forEach(channel => {
                channel.delete("For Loading A Backup.");
            });

            message.guild.roles.cache.filter(role => role.members.every(member => !member.user.bot)).forEach(role => {
                role.delete("For Loading A Backup.");
            });

            await backups[message.author.id][args[1]].roles.forEach(async function(role) {
                message.guild.roles.create({
                    data: {
                        name: role.name,
                        color: role.color,
                        permissions: role.permissions,
                        hoist: role.hoist,
                        mentionable: role.mentionable,
                        position: role.position
                    },
                    reason: "For Loading A Backup."
                }).then(role => {
                    role.setPosition(role.position);
                });
            });

            await backups[message.author.id][args[1]].channels.filter(channels => channels.type === "category").forEach(async function(ch) {
                message.guild.channels.create(ch.name, { type: ch.type, permissionOverwrites: ch.permissionOverwrites, reason: "For Loading A Backup." });
            });

            await backups[message.author.id][args[1]].channels.filter(c => c.type !== "category").forEach(async function(ch) {
                message.guild.channels.create(ch.name, { type: ch.type }).then(c => {
                    const parent = message.guild.channels.cache.filter(c => c.type === "category") .find(c => c.name === ch.parent);
                    ch.parent ? c.setParent(parent) : "";
                });
            });

            await message.guild.setName(backups[message.author.id][args[1]].name);
            await message.guild.setIcon(backups[message.author.id][args[1]].icon);
        } else if (args[0] === "purge") {
            let errorEmbed = new MessageEmbed()
                .setTitle(`Error`)
                .setDescription(`You didn't backup any server yet.`)
                .setColor("RED");
            if (!backups[message.author.id]) return message.channel.send(errorEmbed);

            let warningEmbed = new MessageEmbed()
                .setTitle(`Warning`)
                .setColor("ORANGE")
                .setTimestamp()
                .setDescription(`Are you sure that you want to delete all your backups?\n__This cannot be undone!__`);
            message.channel.send(warningEmbed).then(msg => {
                msg.react("✅");
                msg.react("❌");

                let yesFilter = (reaction, user) => reaction.emoji.name === "✅" && user.id === message.author.id;
                let noFilter = (reaction, user) => reaction.emoji.name === "❌" && user.id === message.author.id;

                let yes = msg.createReactionCollector(yesFilter, { time: 0 });
                let no = msg.createReactionCollector(noFilter, { time: 0 });

                yes.on("collect", r => {
                    delete backups[message.author.id];
                    save();

                    let deletedsuc = new MessageEmbed()
                        .setTitle(`Success`)
                        .setDescription(`Successfully deleted all your backups.`)
                        .setColor("GREEN");
                    message.channel.send(deletedsuc);
                    msg.delete();
                });

                no.on("collect", r => {
                    msg.delete();
                });
            });
        }
    } catch(error) {
        return console.error;
    }
}

function createBackupID(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    let charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * charactersLength)
      );
    }
    return result;
}

function save() {
    fs.writeFile("./assets/backups/backups.json", JSON.stringify(backups), err => {
        if (err) console.error(err);
    });
}

module.exports.config = {
    name: "backup",
    aliases: ["bp"],
    usage: "asdasd"
};