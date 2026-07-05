const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./data');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DISCORD_FILE_PATTERN = /^(.+)\.([^.]+)\.discord\.([^.]+)$/;

/** Retourne le ChannelType Discord à partir du champ type de la config. */
function getChannelType(chanData) {
    return chanData.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
}

/** Construit les permissionOverwrites pour un salon texte. */
function getPermissionOverwrites(guild, chanData) {
    if (chanData.type === 'voice' || !chanData.read_only) return [];

    return [{
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
    }];
}

/** Normalise sync_files en tableau de mots-clés métier. */
function getSyncKeys(syncFiles) {
    if (!syncFiles) return [];
    return Array.isArray(syncFiles) ? syncFiles : [syncFiles];
}

/** Parcourt récursivement un dossier et retourne tous les fichiers. */
function walkDir(dir, files = []) {
    if (!fs.existsSync(dir)) return files;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath, files);
        } else {
            files.push(fullPath);
        }
    }
    return files;
}

/** Extrait le mot-clé métier d'un nom de fichier (filename.key.discord.ext). */
function parseDiscordFile(fileName) {
    const match = fileName.match(DISCORD_FILE_PATTERN);
    if (!match) return null;
    return { baseName: match[1], key: match[2], ext: match[3] };
}

/** Indexe les fichiers Discord par mot-clé métier depuis FILES_DIR. */
function indexFilesByKey(filesDir) {
    const dirPath = path.resolve(PROJECT_ROOT, filesDir);
    const byKey = new Map();

    for (const filePath of walkDir(dirPath)) {
        const parsed = parseDiscordFile(path.basename(filePath));
        if (!parsed) continue;

        if (!byKey.has(parsed.key)) byKey.set(parsed.key, []);
        byKey.get(parsed.key).push(filePath);
    }

    return byKey;
}

/** Récupère la description du dernier commit Git pour un fichier. */
function getCommitMessage(filePath) {
    const relPath = path.relative(PROJECT_ROOT, filePath);

    try {
        const message = execSync(`git log -1 --format=%B -- "${relPath}"`, {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();

        if (message) return message;
    } catch {
        // Pas de dépôt Git ou fichier non suivi
    }

    return `📄 ${path.basename(filePath)}`;
}

/** Récupère tous les noms de pièces jointes déjà envoyés dans le salon. */
async function fetchSentAttachmentNames(channel) {
    const sentNames = new Set();
    let lastId;

    while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const batch = await channel.messages.fetch(options);
        if (batch.size === 0) break;

        for (const msg of batch.values()) {
            for (const att of msg.attachments.values()) {
                sentNames.add(att.name);
            }
        }

        lastId = batch.last().id;
        if (batch.size < 100) break;
    }

    return sentNames;
}

/** Vérifie si un fichier a déjà été envoyé dans le salon (par nom de pièce jointe). */
function wasAlreadySent(sentNames, fileName) {
    return sentNames.has(fileName);
}

/** Synchronise les fichiers correspondant aux mots-clés métier vers un salon Discord. */
async function syncChannelFiles(channel, chanData, filesByKey, sentNames) {
    for (const key of getSyncKeys(chanData.sync_files)) {
        const files = filesByKey.get(key) || [];

        if (files.length === 0) {
            console.log(`    ℹ️ Aucun fichier pour le mot-clé "${key}" dans ${config.FILES_DIR}/`);
            continue;
        }

        for (const filePath of files) {
            const fileName = path.basename(filePath);

            if (wasAlreadySent(sentNames, fileName)) {
                console.log(`    ℹ️ Déjà synchronisé : ${fileName}`);
                continue;
            }

            try {
                const message = getCommitMessage(filePath);
                const attachment = new AttachmentBuilder(filePath, { name: fileName });

                await channel.send({ content: message, files: [attachment] });
                console.log(`    ✅ ${fileName} → ${chanData.name}`);
            } catch (err) {
                console.error(`    ❌ Erreur téléversement ${fileName} :`, err);
            }
        }
    }
}

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
                    const sentNames = await fetchSentAttachmentNames(channel);
                    await syncChannelFiles(channel, chanData, filesByKey, sentNames);
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
