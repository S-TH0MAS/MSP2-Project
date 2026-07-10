const { Client, GatewayIntentBits, Events } = require('discord.js');
const config = require('./config/data');
const infoMessages = require('./config/info-messages');
const { loadEnv } = require('./lib/bot/env');
const {
    ChannelType,
    getChannelType,
    getPermissionOverwrites,
    getCategoryPermissionOverwrites,
    applyDevOnlyPermissions,
} = require('./lib/sync/channels');
const { indexFilesByKey } = require('./lib/sync/files');
const { syncChannelFiles } = require('./lib/sync/sync');
const { syncWelcomeMessage } = require('./lib/sync/welcome');
const { syncInfoMessage } = require('./lib/sync/info');
const { syncPinnedPanel } = require('./lib/sync/panel');
const { syncChannelOrder } = require('./lib/sync/positions');

loadEnv();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
    console.log(`🤖 Bot connecté : ${client.user.tag}`);

    const guildId = process.env.DISCORD_GUILD_ID;
    if (!guildId) {
        console.error('❌ Erreur : DISCORD_GUILD_ID manquant.');
        client.destroy();
        return;
    }

    try {
        const guild = await client.guilds.fetch(guildId);
        await guild.roles.fetch();
        console.log(`⚡ Déploiement de l'infrastructure pour : ${guild.name}`);

        const filesByKey = indexFilesByKey(config.FILES_DIR);
        console.log(`📂 Recherche dans ${config.FILES_DIR}/ — mots-clés trouvés : ${[...filesByKey.keys()].join(', ') || 'aucun'}`);

        let landingChannel = null;

        for (const catData of config.categories) {
            let category = guild.channels.cache.find(c => c.name === catData.name && c.type === ChannelType.GuildCategory);
            if (!category) {
                const createOptions = {
                    name: catData.name,
                    type: ChannelType.GuildCategory,
                };
                const categoryOverwrites = getCategoryPermissionOverwrites(guild, catData);
                if (categoryOverwrites.length > 0) {
                    createOptions.permissionOverwrites = categoryOverwrites;
                }
                category = await guild.channels.create(createOptions);
                console.log(`📁 Catégorie créée : [${catData.name}]`);
            } else if (catData.dev_only) {
                const applied = await applyDevOnlyPermissions(guild, category);
                if (applied) {
                    console.log(`  🔐 Permissions DEV appliquées : [${catData.name}]`);
                }
            }

            for (const chanData of catData.channels) {
                const channelType = getChannelType(chanData);
                let channel = guild.channels.cache.find(
                    c => c.name === chanData.name && c.parentId === category.id && c.type === channelType
                );

                if (!channel) {
                    const misplaced = guild.channels.cache.find(
                        c => c.name === chanData.name && c.type === channelType && c.parentId !== category.id,
                    );
                    if (misplaced) {
                        await misplaced.setParent(category.id);
                        channel = misplaced;
                        console.log(`  ↪️ Salon déplacé : ${chanData.name} → [${catData.name}]`);
                    }
                }

                if (!channel) {
                    channel = await guild.channels.create({
                        name: chanData.name,
                        type: channelType,
                        parent: category.id,
                        permissionOverwrites: getPermissionOverwrites(guild, chanData, catData),
                    });
                    console.log(`  🔹 Salon créé : ${chanData.name} (${chanData.type || 'text'})`);
                } else {
                    console.log(`  🔸 Salon existant (Historique préservé) : ${chanData.name}`);

                    if (catData.dev_only || chanData.dev_only) {
                        const applied = await applyDevOnlyPermissions(guild, channel);
                        if (applied) {
                            console.log(`  🔐 Permissions DEV appliquées : ${chanData.name}`);
                        }
                    } else if (chanData.read_only && channelType === ChannelType.GuildText) {
                        const overwrites = getPermissionOverwrites(guild, chanData);
                        if (overwrites.length > 0) {
                            await channel.permissionOverwrites.edit(
                                guild.roles.everyone,
                                { SendMessages: false },
                            );
                        }
                    }
                }

                if (chanData.landing_channel) {
                    landingChannel = channel;
                }
            }
        }

        await syncChannelOrder(guild, config.categories);

        for (const catData of config.categories) {
            const category = guild.channels.cache.find(
                c => c.name === catData.name && c.type === ChannelType.GuildCategory,
            );
            if (!category) continue;

            for (const chanData of catData.channels) {
                const channelType = getChannelType(chanData);
                const channel = guild.channels.cache.find(
                    c => c.name === chanData.name && c.parentId === category.id && c.type === channelType,
                );
                if (!channel) continue;

                if (chanData.sync_files && channelType === ChannelType.GuildText) {
                    await syncChannelFiles(channel, chanData, filesByKey, config.FILES_DIR);
                }

                if (chanData.welcome_message && channelType === ChannelType.GuildText) {
                    await syncWelcomeMessage(channel, chanData.welcome_message, client.user.id, {
                        pin: Boolean(chanData.landing_channel),
                    });
                }

                if (chanData.info_message && channelType === ChannelType.GuildText) {
                    const definition = infoMessages[chanData.info_message];
                    if (!definition) {
                        console.warn(`    ⚠️ Message info inconnu : "${chanData.info_message}"`);
                    } else {
                        await syncInfoMessage(channel, definition, client.user.id);
                    }
                }

                if (chanData.pinned_panel === 'lock-panel' && channelType === ChannelType.GuildText) {
                    await syncPinnedPanel(channel, client.user.id);
                }
            }
        }

        if (landingChannel) {
            console.log(`🏠 Salon d'accueil : #${landingChannel.name}`);
            console.log('   💡 Pour les nouveaux membres : Discord → Paramètres serveur → Guide du serveur → Salons par défaut → ajouter ce salon');
        }
        console.log('✅ Tout est synchronisé !');
    } catch (error) {
        console.error('❌ Erreur générale :', error);
    }

    client.destroy();
});

client.login(process.env.DISCORD_BOT_TOKEN);
