const path = require('path');
const { REST, Routes } = require('discord.js');
const { requireDiscordEnv, getApplicationIdFromToken } = require('./lib/bot/env');
const { loadCommands } = require('./lib/bot/commands');

requireDiscordEnv();

const { payloads } = loadCommands(path.join(__dirname, 'commands'));

if (payloads.length === 0) {
    console.error('❌ Aucune commande valide trouvée dans scripts/discord/commands/');
    process.exit(1);
}

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log(`⏳ Début du rafraîchissement de ${payloads.length} commande(s) slash...`);

        const data = await rest.put(
            Routes.applicationGuildCommands(
                getApplicationIdFromToken(),
                process.env.DISCORD_GUILD_ID,
            ),
            { body: payloads },
        );

        console.log(`✅ Réussite : ${data.length} commande(s) enregistrée(s) sur le serveur.`);
    } catch (error) {
        console.error('❌ Erreur lors du déploiement des commandes :', error);
        process.exit(1);
    }
})();
