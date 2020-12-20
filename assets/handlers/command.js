const { readdirSync } = require("fs");

module.exports = bot => {
    const load = dirs => {
        const file = readdirSync(`./commands/`).filter(d => d.endsWith(".js"));
        const pull = require(`../../commands/${file}`);
        try {
            bot.commands.set(pull.config.name, pull);
            bot.usage.set(pull.config.name, pull.config.usage);
            pull.config.aliases.forEach(alias => {
                bot.aliases.set(alias, pull.config.name);
            });
        } catch (err) {
            console.log(`Failed to load command: ${file} Error: ${err.message}`);
        }
    };
    ["backup"].forEach(x => load(x));
};