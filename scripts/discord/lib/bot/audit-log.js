const { findAuditLogChannel } = require('./channels-config');

function formatLockAuditMessage({
    discordUser,
    path,
    initialOwners,
    selectedOwners,
    isRemoval,
    hadExisting,
}) {
    const user = `**${discordUser}**`;
    const route = `\`${path}\``;

    if (isRemoval && hadExisting) {
        return `🗑️ ${user} a supprimé le verrou sur ${route}`;
    }

    const initial = new Set(initialOwners);
    const selected = new Set(selectedOwners);
    const added = [...selected].filter(owner => !initial.has(owner));
    const removed = [...initial].filter(owner => !selected.has(owner));
    const parts = [];

    for (const login of added) {
        parts.push(`a ajouté **@${login}**`);
    }
    for (const login of removed) {
        parts.push(`a retiré **@${login}**`);
    }

    if (parts.length === 0) {
        return `🔄 ${user} a synchronisé ${route} (aucun changement)`;
    }

    return `🟢 ${user} ${parts.join(' et ')} sur ${route}`;
}

async function logLockownersAction(guild, data) {
    const channel = findAuditLogChannel(guild, 'lockowners');
    if (!channel) {
        console.warn('⚠️ Salon lockowners-logs introuvable — log non enregistré.');
        return;
    }

    await channel.send(formatLockAuditMessage(data));
}

module.exports = {
    formatLockAuditMessage,
    logLockownersAction,
};
