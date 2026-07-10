const path = require('path');
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { loadEnv } = require('./lib/bot/env');
const { loadCommands } = require('./lib/bot/commands');

loadEnv();

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const { commands } = loadCommands(path.join(__dirname, 'commands'));
client.commands = commands;

client.once(Events.ClientReady, () => {
    console.log(`🤖 Bot connecté avec succès en tant que ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const reply = { content: '❌ **Échec** — Une erreur est survenue lors de l\'exécution de la commande.' };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
        return;
    }

    for (const command of client.commands.values()) {
        if (typeof command.handleInteraction !== 'function') continue;

        try {
            await command.handleInteraction(interaction);
            return;
        } catch (error) {
            console.error('Erreur d\'interaction :', error);
            return;
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
