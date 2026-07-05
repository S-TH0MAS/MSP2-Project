const { ChannelType, PermissionFlagsBits } = require('discord.js');

function getChannelType(chanData) {
    return chanData.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
}

function getPermissionOverwrites(guild, chanData) {
    if (chanData.type === 'voice' || !chanData.read_only) return [];

    return [{
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages],
    }];
}

module.exports = {
    ChannelType,
    getChannelType,
    getPermissionOverwrites,
};
