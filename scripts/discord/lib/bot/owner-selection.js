const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const USERS_PER_ROW = 5;
const MAX_USER_ROWS = 4;

const CUSTOM_IDS = {
    TOGGLE_PREFIX: 'lock_toggle_user:',
    CONFIRM: 'lock_confirm_owners',
    RESET: 'lock_reset_owners',
};

function parseToggleLogin(customId) {
    if (!customId.startsWith(CUSTOM_IDS.TOGGLE_PREFIX)) return null;
    return customId.slice(CUSTOM_IDS.TOGGLE_PREFIX.length);
}

function formatSelectedOwners(selected) {
    if (!selected || selected.size === 0) return '_aucun — le verrou sera retiré à la validation_';
    return [...selected].map(login => `**@${login}**`).join(', ');
}

function buildOwnerSelectionContent(path, selected, isExisting) {
    const mode = isExisting
        ? 'Ajustez les propriétaires existants (retirer tous = suppression du verrou).'
        : 'Sélectionnez les propriétaires pour créer le verrou.';

    return [
        `### 👤 Sync — \`${path}\``,
        mode,
        'Cliquez sur les comptes pour ajouter ou retirer, puis **Valider**.',
        '',
        '| Sélection |',
        '| --- |',
        `| ${formatSelectedOwners(selected)} |`,
    ].join('\n');
}

function buildOwnerSelectionComponents(logins, selected, initialOwners) {
    const visibleLogins = logins.slice(0, USERS_PER_ROW * MAX_USER_ROWS);
    const rows = [];
    const hasChanges = !setsEqual(selected, initialOwners);

    for (let i = 0; i < visibleLogins.length; i += USERS_PER_ROW) {
        const chunk = visibleLogins.slice(i, i + USERS_PER_ROW);
        const row = new ActionRowBuilder();

        for (const login of chunk) {
            const isSelected = selected.has(login);
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`${CUSTOM_IDS.TOGGLE_PREFIX}${login}`)
                    .setLabel(isSelected ? `✓ ${login}` : login)
                    .setStyle(isSelected ? ButtonStyle.Success : ButtonStyle.Secondary),
            );
        }

        rows.push(row);
    }

    const confirmLabel = selected.size === 0 ? '🗑️ Retirer le verrou' : '✅ Valider';

    rows.push(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(CUSTOM_IDS.CONFIRM)
                .setLabel(confirmLabel)
                .setStyle(selected.size === 0 ? ButtonStyle.Danger : ButtonStyle.Primary)
                .setDisabled(!hasChanges),
            new ButtonBuilder()
                .setCustomId(CUSTOM_IDS.RESET)
                .setLabel('🔄 Réinitialiser')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(!hasChanges),
        ),
    );

    return rows;
}

function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const value of a) {
        if (!b.has(value)) return false;
    }
    return true;
}

function buildOwnerSelectionPayload(path, logins, selected, initialOwners) {
    const isExisting = initialOwners.size > 0;

    return {
        content: buildOwnerSelectionContent(path, selected, isExisting),
        components: buildOwnerSelectionComponents(logins, selected, initialOwners),
    };
}

module.exports = {
    CUSTOM_IDS,
    USERS_PER_ROW,
    MAX_USER_ROWS,
    parseToggleLogin,
    buildOwnerSelectionPayload,
};
