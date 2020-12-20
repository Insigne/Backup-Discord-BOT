module.exports = async(client) => {
    
    let activities = [ `${client.guilds.cache.size} servers | m!help` ], i = 0;
    setInterval(() => client.user.setActivity(`${activities[i++ % activities.length]}`, { type: "WATCHING" }), 15000);

    console.log(`${client.user.username} online!`);
    setInterval(() => console.log(`${client.user.username} currently online on ${client.guilds.cache.size} servers with ${client.users.cache.size} user.`), 15000);
}