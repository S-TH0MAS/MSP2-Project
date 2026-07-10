const { fetchAllMessages } = require('./messages');

/** Préfixe invisible pour identifier les messages d'accueil gérés par GitOps. */
const WELCOME_PREFIX = '\u2060';

function wrapWelcomeContent(content) {
    return `${WELCOME_PREFIX}${content.trim()}`;
}

function unwrapWelcomeContent(content) {
    return content.startsWith(WELCOME_PREFIX) ? content.slice(WELCOME_PREFIX.length) : content;
}

function isWelcomeMessage(message, botUserId) {
    return message.author.id === botUserId && message.content.startsWith(WELCOME_PREFIX);
}

async function pinWelcomeMessage(channel, keeper, botUserId) {
    const { items } = await channel.messages.fetchPins();

    for (const item of items) {
        const message = item.message;
        if (isWelcomeMessage(message, botUserId) && message.id !== keeper.id) {
            await message.unpin();
        }
    }

    if (!keeper.pinned) {
        await keeper.pin('MSP2 GitOps — message d\'accueil');
        console.log('    📌 Message d\'accueil épinglé');
    }
}

async function syncWelcomeMessage(channel, content, botUserId, { pin = false } = {}) {
    const expected = wrapWelcomeContent(content);
    const messages = await fetchAllMessages(channel);
    const welcomeMessages = messages.filter(msg => isWelcomeMessage(msg, botUserId));

    let keeper = welcomeMessages.find(msg => msg.content === expected);

    if (keeper) {
        console.log('    ℹ️ Message d\'accueil à jour');
    } else if (welcomeMessages.length > 0) {
        keeper = welcomeMessages[0];
        await keeper.edit(expected);
        console.log('    ✏️ Message d\'accueil mis à jour');
    } else {
        keeper = await channel.send(expected);
        console.log('    ✅ Message d\'accueil publié');
    }

    for (const duplicate of welcomeMessages) {
        if (duplicate.id === keeper.id) continue;

        try {
            await duplicate.delete();
            console.log('    🗑️ Doublon message d\'accueil supprimé');
        } catch (err) {
            console.error('    ❌ Erreur suppression doublon accueil :', err);
        }
    }

    if (pin) {
        await pinWelcomeMessage(channel, keeper, botUserId);
    }

    return keeper;
}

module.exports = {
    WELCOME_PREFIX,
    wrapWelcomeContent,
    unwrapWelcomeContent,
    isWelcomeMessage,
    pinWelcomeMessage,
    syncWelcomeMessage,
};
