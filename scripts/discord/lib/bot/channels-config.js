const { ChannelType } = require('discord.js');
const { loadDataConfig } = require('./load-data-config');

const config = loadDataConfig();

function findChannelEntry(predicate) {
    for (const category of config.categories) {
        for (const channel of category.channels) {
            if (predicate(channel, category)) {
                return { category, channel };
            }
        }
    }
    return null;
}

function getLockPanelChannelName() {
    return findChannelEntry(ch => ch.pinned_panel === 'lock-panel')?.channel.name ?? null;
}

function isLockPanelChannel(interaction) {
    const expectedName = getLockPanelChannelName();
    if (!expectedName) return true;
    return interaction.channel?.name === expectedName;
}

function findGuildChannel(guild, channelName, categoryName) {
    const category = guild.channels.cache.find(
        c => c.name === categoryName && c.type === ChannelType.GuildCategory,
    );
    if (!category) return null;

    return guild.channels.cache.find(
        c => c.name === channelName && c.parentId === category.id,
    ) ?? null;
}

function findAuditLogChannel(guild, auditKey) {
    const entry = findChannelEntry(ch => ch.audit_log === auditKey);
    if (!entry) return null;
    return findGuildChannel(guild, entry.channel.name, entry.category.name);
}

module.exports = {
    findChannelEntry,
    getLockPanelChannelName,
    isLockPanelChannel,
    findGuildChannel,
    findAuditLogChannel,
};
