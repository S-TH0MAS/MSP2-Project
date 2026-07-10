const { fetchAllMessages } = require('./messages');
const { buildLockPanelPayload } = require('../bot/lock-panel-ui');

/** Préfixe invisible pour identifier le panneau lock-panel géré par GitOps. */
const PANEL_PREFIX = '\u2061';

function wrapPanelContent(content) {
    return `${PANEL_PREFIX}${content}`;
}

function isPanelMessage(message, botUserId) {
    return message.author.id === botUserId && message.content.startsWith(PANEL_PREFIX);
}

function buildSyncedPanelPayload() {
    const payload = buildLockPanelPayload();
    return {
        content: wrapPanelContent(payload.content),
        components: payload.components,
    };
}

function getButtonCustomIds(components) {
    const ids = [];

    for (const row of components) {
        const rowComponents = row.components ?? [];
        for (const component of rowComponents) {
            const customId = component.customId ?? component.data?.custom_id;
            if (customId) ids.push(customId);
        }
    }

    return ids.sort().join('\0');
}

function payloadsMatch(message, expected) {
    return message.content === expected.content
        && getButtonCustomIds(message.components) === getButtonCustomIds(expected.components);
}

async function pinPanelMessage(channel, keeper, botUserId) {
    const { items } = await channel.messages.fetchPins();

    for (const item of items) {
        const message = item.message;
        if (isPanelMessage(message, botUserId) && message.id !== keeper.id) {
            await message.unpin();
        }
    }

    if (!keeper.pinned) {
        await keeper.pin('MSP2 GitOps — panneau lockowners');
        console.log('    📌 Panneau lockowners épinglé');
    }
}

async function syncPinnedPanel(channel, botUserId) {
    const expected = buildSyncedPanelPayload();
    const messages = await fetchAllMessages(channel);
    const panelMessages = messages.filter(msg => isPanelMessage(msg, botUserId));

    let keeper = panelMessages.find(msg => payloadsMatch(msg, expected));

    if (keeper) {
        console.log('    ℹ️ Panneau lockowners à jour');
    } else if (panelMessages.length > 0) {
        keeper = panelMessages[0];
        await keeper.edit(expected);
        console.log('    ✏️ Panneau lockowners mis à jour');
    } else {
        keeper = await channel.send(expected);
        console.log('    ✅ Panneau lockowners publié');
    }

    for (const duplicate of panelMessages) {
        if (duplicate.id === keeper.id) continue;

        try {
            await duplicate.delete();
            console.log('    🗑️ Doublon panneau lockowners supprimé');
        } catch (err) {
            console.error('    ❌ Erreur suppression doublon panneau :', err);
        }
    }

    await pinPanelMessage(channel, keeper, botUserId);
    return keeper;
}

module.exports = {
    PANEL_PREFIX,
    isPanelMessage,
    syncPinnedPanel,
};
