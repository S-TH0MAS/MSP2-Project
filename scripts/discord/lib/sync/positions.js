const { ChannelType, getChannelType } = require('./channels');

function findCategory(guild, catData) {
    return guild.channels.cache.find(
        c => c.name === catData.name && c.type === ChannelType.GuildCategory,
    ) ?? null;
}

function findChannel(guild, category, chanData) {
    const channelType = getChannelType(chanData);
    return guild.channels.cache.find(
        c => c.name === chanData.name && c.parentId === category.id && c.type === channelType,
    ) ?? null;
}

async function syncChannelOrder(guild, categoriesConfig) {
    await guild.channels.fetch();

    const positions = [];

    for (let categoryIndex = 0; categoryIndex < categoriesConfig.length; categoryIndex++) {
        const catData = categoriesConfig[categoryIndex];
        const category = findCategory(guild, catData);
        if (!category) continue;

        positions.push({ channel: category, position: categoryIndex });

        for (let channelIndex = 0; channelIndex < catData.channels.length; channelIndex++) {
            const chanData = catData.channels[channelIndex];
            const channel = findChannel(guild, category, chanData);
            if (!channel) continue;

            positions.push({ channel, position: channelIndex });
        }
    }

    if (positions.length === 0) return;

    await guild.channels.setPositions(positions);
    console.log('📐 Ordre des catégories et salons synchronisé');
}

module.exports = {
    findCategory,
    findChannel,
    syncChannelOrder,
};
