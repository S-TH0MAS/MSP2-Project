async function fetchAllMessages(channel) {
    const messages = [];
    let lastId;

    while (true) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const batch = await channel.messages.fetch(options);
        if (batch.size === 0) break;

        messages.push(...batch.values());
        lastId = batch.last().id;
        if (batch.size < 100) break;
    }

    return messages;
}

module.exports = {
    fetchAllMessages,
};
