/**
 * Point d'entrée du bundle standalone — ne pas lancer en dev (utiliser bot-server.js).
 */
import { Client, GatewayIntentBits } from 'discord.js';
import * as sharedEnv from '../lib/bot/env.js';
import * as commandsLib from '../lib/bot/commands.js';
import * as lockPanelModule from '../commands/lock-panel.js';

sharedEnv.loadEnv();

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const { commands } = commandsLib.loadCommands([lockPanelModule]);
client.commands = commands;

client.once('ready', () => {
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

if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('❌ DISCORD_BOT_TOKEN manquant — relancez le build avec un .env valide.');
    process.exit(1);
}

client.login(process.env.DISCORD_BOT_TOKEN);
