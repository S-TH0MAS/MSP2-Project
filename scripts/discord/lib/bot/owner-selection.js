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
    if (!selected || selected.size === 0) return '_aucun — sélectionnez au moins un compte_';
    return [...selected].map(login => `**@${login}**`).join(', ');
}

function buildOwnerSelectionContent(path, selected) {
    return [
        `### 👤 2/2 - Propriétaires pour \`${path}\``,
        'Cliquez sur les lignes du tableau pour sélectionner ou désélectionner, puis **Valider**.',
        '',
        '| Sélection |',
        '| --- |',
        `| ${formatSelectedOwners(selected)} |`,
    ].join('\n');
}

function buildOwnerSelectionComponents(logins, selected) {
    const visibleLogins = logins.slice(0, USERS_PER_ROW * MAX_USER_ROWS);
    const rows = [];

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

    rows.push(
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(CUSTOM_IDS.CONFIRM)
                .setLabel('✅ Valider')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(selected.size === 0),
            new ButtonBuilder()
                .setCustomId(CUSTOM_IDS.RESET)
                .setLabel('🔄 Réinitialiser')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(selected.size === 0),
        ),
    );

    return rows;
}

function buildOwnerSelectionPayload(path, logins, selected) {
    return {
        content: buildOwnerSelectionContent(path, selected),
        components: buildOwnerSelectionComponents(logins, selected),
    };
}

module.exports = {
    CUSTOM_IDS,
    USERS_PER_ROW,
    MAX_USER_ROWS,
    parseToggleLogin,
    buildOwnerSelectionPayload,
};
