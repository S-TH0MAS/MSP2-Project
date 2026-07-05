const path = require('path');
const { AttachmentBuilder } = require('discord.js');
const { getSyncKeys, isManagedAttachment, getLocalFileNames } = require('./files');
const { fetchAllMessages } = require('./messages');
const { getCommitMessage } = require('./git');

async function syncChannelFiles(channel, chanData, filesByKey, filesDir) {
    const syncKeys = getSyncKeys(chanData.sync_files);
    const localFileNames = getLocalFileNames(chanData, filesByKey);
    const messages = await fetchAllMessages(channel);
    const sentNames = new Set();

    for (const msg of messages) {
        if (msg.attachments.size === 0) continue;

        const attachments = [...msg.attachments.values()];
        const managed = attachments.filter(att => isManagedAttachment(att.name, syncKeys));
        if (managed.length === 0) continue;

        const isStale = managed.some(att => !localFileNames.has(att.name));

        if (isStale) {
            try {
                await msg.delete();
                console.log(`    🗑️ Supprimé (fichier absent localement) : ${managed.map(a => a.name).join(', ')}`);
            } catch (err) {
                console.error(`    ❌ Erreur suppression : ${managed.map(a => a.name).join(', ')}`, err);
            }
            continue;
        }

        for (const att of managed) {
            sentNames.add(att.name);
        }
    }

    for (const key of syncKeys) {
        const files = filesByKey.get(key) || [];

        if (files.length === 0) {
            console.log(`    ℹ️ Aucun fichier pour le mot-clé "${key}" dans ${filesDir}/`);
        }

        for (const filePath of files) {
            const fileName = path.basename(filePath);

            if (sentNames.has(fileName)) {
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

module.exports = {
    syncChannelFiles,
};
