module.exports = async (bot, message) => {
    if(message.author.type === 'bot') return;
    const args = message.content
        .slice(2)
        .trim()
        .split(/ +/g);
        
    let command = args.shift();

    if (!message.content.startsWith("b!")) {
        return false;
    } else {
        command = command.toLowerCase();

        let commandFile;
        if (bot.commands.has(command)) {
            commandFile = bot.commands.get(command);
        } else if (bot.aliases.has(command)) {
            commandFile = bot.commands.get(bot.aliases.get(command));
        } else {
            return false;
        }

        //* Alias checking
        if (bot.aliases.has(command)) {
            const isAlias = bot.commands.get(bot.aliases.get(command)).config.name;
            if (isAlias !== undefined) return false;
        }

        if (commandFile) {
            console.log(`[(${message.guild.me.user.username}) (${message.author.username}) (${command}) (${args.length == 0 ? "No args detected." : args})]`);
            commandFile.run(bot, message, args);
            return true;
        }

        return false;
    }
};