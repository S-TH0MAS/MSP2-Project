const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const { validatePath } = require('../lib/bot/validate-lock');
const { fetchLockownersFile, listCollaborators, appendLockownersLine } = require('../lib/bot/github');
const {
    CUSTOM_IDS,
    parseToggleLogin,
    buildOwnerSelectionPayload,
    USERS_PER_ROW,
    MAX_USER_ROWS,
} = require('../lib/bot/owner-selection');

/** @type {Map<string, { path: string, selected: Set<string>, logins: string[] }>} */
const sessions = new Map();

function getSession(userId) {
    return sessions.get(userId);
}

function clearSession(userId) {
    sessions.delete(userId);
}

function startSession(userId, path, logins) {
    const session = { path, selected: new Set(), logins };
    sessions.set(userId, session);
    return session;
}

async function commitLock(interaction, session) {
    const { path, selected } = session;

    const { locks } = await fetchLockownersFile();
    const validation = validatePath(path, locks);

    if (!validation.valid) {
        clearSession(interaction.user.id);
        await interaction.editReply({ content: validation.message, components: [] });
        return;
    }

    const selectedOwners = [...selected];
    await appendLockownersLine(path, selectedOwners);
    clearSession(interaction.user.id);

    await interaction.editReply({
        content: `✅ **Réussite** — \`${path}\` est verrouillé pour : ${selectedOwners.map(o => `**@${o}**`).join(', ')}.`,
        components: [],
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock-panel')
        .setDescription('Affiche le bouton de création graphique de verrous'),

    async execute(interaction) {
        const button = new ButtonBuilder()
            .setCustomId('open_lock_modal')
            .setLabel('🔒 Verrouiller un dossier / fichier')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({
            content: '### 🛡️ Gestionnaire GitOps des Verrous\nCliquez sur le bouton ci-dessous pour sécuriser un emplacement.',
            components: [row],
        });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'open_lock_modal') {
            const modal = new ModalBuilder()
                .setCustomId('lock_path_modal')
                .setTitle('1/2 - Emplacement du verrou');

            const pathInput = new TextInputBuilder()
                .setCustomId('lock_path')
                .setLabel('Chemin du fichier ou dossier à protéger')
                .setPlaceholder('ex: scripts/discord/configure.js')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(pathInput));
            return interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId === 'lock_path_modal') {
            const pathParam = interaction.fields.getTextInputValue('lock_path');
            await interaction.deferReply();

            try {
                const { locks } = await fetchLockownersFile();
                const validation = validatePath(pathParam, locks);

                if (!validation.valid) {
                    return interaction.editReply({ content: validation.message, components: [] });
                }

                const collaborators = await listCollaborators();

                if (!collaborators || collaborators.length === 0) {
                    return interaction.editReply({
                        content: '❌ **Échec** — Aucun collaborateur trouvé sur ce dépôt GitHub.',
                        components: [],
                    });
                }

                const logins = collaborators.map(member => member.login);
                const session = startSession(interaction.user.id, validation.normalized, logins);
                const payload = buildOwnerSelectionPayload(session.path, session.logins, session.selected);

                const maxVisible = USERS_PER_ROW * MAX_USER_ROWS;
                if (logins.length > maxVisible) {
                    payload.content += `\n\n_ℹ️ ${logins.length} collaborateurs — seuls les ${maxVisible} premiers sont affichés._`;
                }

                return interaction.editReply(payload);
            } catch (error) {
                console.error(error);
                clearSession(interaction.user.id);
                return interaction.editReply({
                    content: `❌ **Échec** — ${error.message}`,
                    components: [],
                });
            }
        }

        if (!interaction.isButton()) return;

        const session = getSession(interaction.user.id);
        if (!session) {
            return interaction.reply({
                content: '❌ **Échec** — Session expirée. Veuillez relancer `/lock-panel`.',
            });
        }

        const toggleLogin = parseToggleLogin(interaction.customId);

        if (toggleLogin) {
            if (!session.logins.includes(toggleLogin)) {
                return interaction.reply({ content: '❌ **Échec** — Collaborateur inconnu.' });
            }

            if (session.selected.has(toggleLogin)) {
                session.selected.delete(toggleLogin);
            } else {
                session.selected.add(toggleLogin);
            }

            return interaction.update(
                buildOwnerSelectionPayload(session.path, session.logins, session.selected),
            );
        }

        if (interaction.customId === CUSTOM_IDS.RESET) {
            session.selected.clear();
            return interaction.update(
                buildOwnerSelectionPayload(session.path, session.logins, session.selected),
            );
        }

        if (interaction.customId === CUSTOM_IDS.CONFIRM) {
            if (session.selected.size === 0) {
                return interaction.reply({
                    content: '❌ **Échec** — Sélectionnez au moins un propriétaire avant de valider.',
                });
            }

            await interaction.deferUpdate();

            try {
                await commitLock(interaction, session);
            } catch (error) {
                console.error(error);
                await interaction.followUp({
                    content: `❌ **Échec** — Erreur API GitHub : ${error.message}`,
                });
            }
        }
    },
};
