const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { getDevRoleName } = require('../bot/dev-role');

function getChannelType(chanData) {
    return chanData.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
}

function findDevRole(guild) {
    const roleName = getDevRoleName();
    return guild.roles.cache.find(role => role.name === roleName) ?? null;
}

function buildDevOnlyOverwrites(guild, { isVoice = false } = {}) {
    const devRole = findDevRole(guild);
    if (!devRole) return null;

    const everyoneDeny = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
    ];

    const devAllow = [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.UseVAD,
        PermissionFlagsBits.ReadMessageHistory,
    ];

    if (!isVoice) {
        devAllow.push(PermissionFlagsBits.SendMessages);
    }

    return [
        { id: guild.roles.everyone.id, deny: everyoneDeny },
        { id: devRole.id, allow: devAllow },
    ];
}

function isDevOnlyScope(chanData, catData) {
    return Boolean(catData?.dev_only || chanData?.dev_only);
}

function getCategoryPermissionOverwrites(guild, catData) {
    if (!catData.dev_only) return [];
    return buildDevOnlyOverwrites(guild) ?? [];
}

function getPermissionOverwrites(guild, chanData, catData = null) {
    if (isDevOnlyScope(chanData, catData)) {
        return buildDevOnlyOverwrites(guild, { isVoice: chanData.type === 'voice' }) ?? [];
    }

    if (chanData.type === 'voice' || !chanData.read_only) return [];

    return [{
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
    }];
}

async function applyDevOnlyPermissions(guild, target) {
    const devRole = findDevRole(guild);
    const roleName = getDevRoleName();

    if (!devRole) {
        console.warn(`  ⚠️ Rôle **${roleName}** introuvable — permissions DEV non appliquées sur ${target.name}`);
        return false;
    }

    const isVoice = target.type === ChannelType.GuildVoice;
    const overwrites = buildDevOnlyOverwrites(guild, { isVoice });

    if (!overwrites) return false;

    await target.permissionOverwrites.set(overwrites);
    return true;
}

module.exports = {
    ChannelType,
    getChannelType,
    findDevRole,
    buildDevOnlyOverwrites,
    isDevOnlyScope,
    getCategoryPermissionOverwrites,
    getPermissionOverwrites,
    applyDevOnlyPermissions,
};
