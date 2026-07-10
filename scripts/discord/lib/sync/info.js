const { fetchAllMessages } = require('./messages');

/** Préfixe invisible — messages d'information gérés par GitOps. */
const INFO_PREFIX = '\u2062';

function buildInfoContent(definition) {
    const parts = [definition.title, ''];

    if (definition.intro?.length) {
        parts.push(...definition.intro, '');
    }

    for (const section of definition.sections ?? []) {
        parts.push(`**${section.heading}**`);
        parts.push(`Salon : ${section.channel} — mot-clé \`${section.keyword}\``);
        for (const line of section.lines ?? []) {
            parts.push(`- ${line}`);
        }
        parts.push('');
    }

    if (definition.outro?.length) {
        parts.push(...definition.outro);
    }

    return parts.join('\n').trim();
}

function wrapInfoContent(content) {
    return `${INFO_PREFIX}${content}`;
}

function isInfoMessage(message, botUserId) {
    return message.author.id === botUserId && message.content.startsWith(INFO_PREFIX);
}

async function syncInfoMessage(channel, definition, botUserId) {
    const expected = wrapInfoContent(buildInfoContent(definition));
    const messages = await fetchAllMessages(channel);
    const infoMessages = messages.filter(msg => isInfoMessage(msg, botUserId));

    let keeper = infoMessages.find(msg => msg.content === expected);

    if (keeper) {
        console.log('    ℹ️ Message info à jour');
    } else if (infoMessages.length > 0) {
        keeper = infoMessages[0];
        await keeper.edit(expected);
        console.log('    ✏️ Message info mis à jour');
    } else {
        keeper = await channel.send(expected);
        console.log('    ✅ Message info publié');
    }

    for (const duplicate of infoMessages) {
        if (duplicate.id === keeper.id) continue;

        try {
            await duplicate.delete();
            console.log('    🗑️ Doublon message info supprimé');
        } catch (err) {
            console.error('    ❌ Erreur suppression doublon info :', err);
        }
    }

    return keeper;
}

module.exports = {
    INFO_PREFIX,
    buildInfoContent,
    isInfoMessage,
    syncInfoMessage,
};
