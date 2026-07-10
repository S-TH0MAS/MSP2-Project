const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
const { resolvePathForSync } = require('../lib/bot/lock-sync');
const { fetchLockownersFile, listCollaborators, syncLockownersLine } = require('../lib/bot/github');
const {
    CUSTOM_IDS,
    parseToggleLogin,
    buildOwnerSelectionPayload,
    USERS_PER_ROW,
    MAX_USER_ROWS,
} = require('../lib/bot/owner-selection');

/** @type {Map<string, { path: string, selected: Set<string>, initialOwners: Set<string>, logins: string[] }>} */
const sessions = new Map();

function getSession(userId) {
    return sessions.get(userId);
}

function clearSession(userId) {
    sessions.delete(userId);
}

function startSession(userId, path, logins, existingOwners = []) {
    const initialOwners = new Set(existingOwners);
    const session = {
        path,
        selected: new Set(existingOwners),
        initialOwners,
        logins,
    };
    sessions.set(userId, session);
    return session;
}

async function commitSync(interaction, session) {
    const { path, selected, initialOwners } = session;
    const { locks } = await fetchLockownersFile();
    const resolution = resolvePathForSync(path, locks);

    if (resolution.action === 'error') {
        clearSession(interaction.user.id);
        await interaction.editReply({ content: resolution.message, components: [] });
        return;
    }

    const selectedOwners = [...selected];
    const isRemoval = selectedOwners.length === 0;
    const hadExisting = initialOwners.size > 0;

    await syncLockownersLine(path, selectedOwners);
    clearSession(interaction.user.id);

    if (isRemoval && hadExisting) {
        await interaction.editReply({
            content: `✅ **Réussite** — Le verrou sur \`${path}\` a été retiré.`,
            components: [],
        });
        return;
    }

    if (isRemoval) {
        await interaction.editReply({
            content: `ℹ️ Aucun verrou à retirer pour \`${path}\`.`,
            components: [],
        });
        return;
    }

    await interaction.editReply({
        content: `✅ **Réussite** — \`${path}\` synchronisé pour : ${selectedOwners.map(o => `**@${o}**`).join(', ')}.`,
        components: [],
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock-panel')
        .setDescription('Affiche le panneau de synchronisation des verrous'),

    async execute(interaction) {
        const button = new ButtonBuilder()
            .setCustomId('open_lock_modal')
            .setLabel('🔒 Synchroniser un verrou')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({
            content: '### 🛡️ Gestionnaire GitOps des Verrous\nChoisissez un chemin pour créer, modifier ou retirer un verrou.',
            components: [row],
        });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'open_lock_modal') {
            const modal = new ModalBuilder()
                .setCustomId('lock_path_modal')
                .setTitle('Chemin à synchroniser');

            const pathInput = new TextInputBuilder()
                .setCustomId('lock_path')
                .setLabel('Chemin du fichier ou dossier')
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
                const resolution = resolvePathForSync(pathParam, locks);

                if (resolution.action === 'error') {
                    return interaction.editReply({ content: resolution.message, components: [] });
                }

                const collaborators = await listCollaborators();

                if (!collaborators || collaborators.length === 0) {
                    return interaction.editReply({
                        content: '❌ **Échec** — Aucun collaborateur trouvé sur ce dépôt GitHub.',
                        components: [],
                    });
                }

                const logins = collaborators.map(member => member.login);
                const session = startSession(
                    interaction.user.id,
                    resolution.normalized,
                    logins,
                    resolution.existingOwners,
                );
                const payload = buildOwnerSelectionPayload(
                    session.path,
                    session.logins,
                    session.selected,
                    session.initialOwners,
                );

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
                buildOwnerSelectionPayload(
                    session.path,
                    session.logins,
                    session.selected,
                    session.initialOwners,
                ),
            );
        }

        if (interaction.customId === CUSTOM_IDS.RESET) {
            session.selected = new Set(session.initialOwners);
            return interaction.update(
                buildOwnerSelectionPayload(
                    session.path,
                    session.logins,
                    session.selected,
                    session.initialOwners,
                ),
            );
        }

        if (interaction.customId === CUSTOM_IDS.CONFIRM) {
            await interaction.deferUpdate();

            try {
                await commitSync(interaction, session);
            } catch (error) {
                console.error(error);
                await interaction.followUp({
                    content: `❌ **Échec** — Erreur API GitHub : ${error.message}`,
                });
            }
        }
    },
};
