const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config/data');
const { loadEnv } = require('./lib/bot/env');
const { ChannelType, getChannelType, getPermissionOverwrites } = require('./lib/sync/channels');
const { indexFilesByKey } = require('./lib/sync/files');
const { syncChannelFiles } = require('./lib/sync/sync');

loadEnv();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`🤖 Bot connecté : ${client.user.tag}`);

    const guildId = process.env.DISCORD_GUILD_ID;
    if (!guildId) {
        console.error('❌ Erreur : DISCORD_GUILD_ID manquant.');
        client.destroy();
        return;
    }

    try {
        const guild = await client.guilds.fetch(guildId);
        console.log(`⚡ Déploiement de l'infrastructure pour : ${guild.name}`);

        const filesByKey = indexFilesByKey(config.FILES_DIR);
        console.log(`📂 Recherche dans ${config.FILES_DIR}/ — mots-clés trouvés : ${[...filesByKey.keys()].join(', ') || 'aucun'}`);

        for (const catData of config.categories) {
            let category = guild.channels.cache.find(c => c.name === catData.name && c.type === ChannelType.GuildCategory);
            if (!category) {
                category = await guild.channels.create({ name: catData.name, type: ChannelType.GuildCategory });
                console.log(`📁 Catégorie créée : [${catData.name}]`);
            }

            for (const chanData of catData.channels) {
                const channelType = getChannelType(chanData);
                let channel = guild.channels.cache.find(
                    c => c.name === chanData.name && c.parentId === category.id && c.type === channelType
                );

                if (!channel) {
                    channel = await guild.channels.create({
                        name: chanData.name,
                        type: channelType,
                        parent: category.id,
                        permissionOverwrites: getPermissionOverwrites(guild, chanData),
                    });
                    console.log(`  🔹 Salon créé : ${chanData.name} (${chanData.type || 'text'})`);
                } else {
                    console.log(`  🔸 Salon existant (Historique préservé) : ${chanData.name}`);
                }

                if (chanData.sync_files && channelType === ChannelType.GuildText) {
                    await syncChannelFiles(channel, chanData, filesByKey, config.FILES_DIR);
                }
            }
        }
        console.log('✅ Tout est synchronisé !');
    } catch (error) {
        console.error('❌ Erreur générale :', error);
    }

    client.destroy();
});

client.login(process.env.DISCORD_BOT_TOKEN);
