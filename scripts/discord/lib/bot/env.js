const { PROJECT_ROOT, loadEnv } = require('../../../lib/env');

function requireDiscordEnv() {
    loadEnv();
    if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
        console.error('❌ Erreur : DISCORD_BOT_TOKEN ou DISCORD_GUILD_ID manquant dans le .env');
        process.exit(1);
    }
}

function getApplicationIdFromToken(token = process.env.DISCORD_BOT_TOKEN) {
    return Buffer.from(token.split('.')[0], 'base64').toString('utf-8');
}

module.exports = {
    PROJECT_ROOT,
    loadEnv,
    requireDiscordEnv,
    getApplicationIdFromToken,
};
