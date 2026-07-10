const {
    SlashCommandBuilder,
    ActionRowBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalBuilder,
} = require('discord.js');
const { resolvePathForSync } = require('../lib/bot/lock-sync');
const { fetchLockownersFile, listCollaborators, syncLockownersLine } = require('../lib/bot/github');
const { isLockPanelChannel, getLockPanelChannelName } = require('../lib/bot/channels-config');
const { logLockownersAction } = require('../lib/bot/audit-log');
const { scheduleEphemeralCleanup } = require('../lib/bot/ephemeral');
const { OPEN_LOCK_MODAL, buildLockPanelPayload } = require('../lib/bot/lock-panel-ui');
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

function denyWrongChannel(interaction) {
    const channelName = getLockPanelChannelName() ?? '🔒┃lockowners';
    return interaction.reply({
        content: `❌ **Échec** — Utilisez le message épinglé dans **${channelName}**.`,
        ephemeral: true,
    });
}

async function sendEphemeralResult(interaction, content) {
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content, components: [] });
    } else {
        await interaction.reply({ content, ephemeral: true });
    }
    scheduleEphemeralCleanup(interaction);
}

async function commitSync(interaction, session) {
    const { path, selected, initialOwners } = session;
    const { locks } = await fetchLockownersFile();
    const resolution = resolvePathForSync(path, locks);

    if (resolution.action === 'error') {
        clearSession(interaction.user.id);
        await sendEphemeralResult(interaction, resolution.message);
        return;
    }

    const selectedOwners = [...selected];
    const initialOwnerList = [...initialOwners];
    const isRemoval = selectedOwners.length === 0;
    const hadExisting = initialOwners.size > 0;

    await syncLockownersLine(path, selectedOwners);
    clearSession(interaction.user.id);

    await logLockownersAction(interaction.guild, {
        discordUser: interaction.user.tag,
        path,
        initialOwners: initialOwnerList,
        selectedOwners,
        isRemoval,
        hadExisting,
    });

    if (isRemoval && hadExisting) {
        await sendEphemeralResult(
            interaction,
            `✅ **Réussite** — Le verrou sur \`${path}\` a été retiré.`,
        );
        return;
    }

    if (isRemoval) {
        await sendEphemeralResult(
            interaction,
            `ℹ️ Aucun verrou à retirer pour \`${path}\`.`,
        );
        return;
    }

    await sendEphemeralResult(
        interaction,
        `✅ **Réussite** — \`${path}\` synchronisé pour : ${selectedOwners.map(o => `**@${o}**`).join(', ')}.`,
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock-panel')
        .setDescription('Ouvre le panneau de synchronisation des verrous (éphémère)'),

    async execute(interaction) {
        await interaction.reply({
            ...buildLockPanelPayload(),
            ephemeral: true,
        });
    },

    async handleInteraction(interaction) {
        if (!isLockPanelChannel(interaction)) {
            return denyWrongChannel(interaction);
        }

        if (interaction.isButton() && interaction.customId === OPEN_LOCK_MODAL) {
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
            await interaction.deferReply({ ephemeral: true });

            try {
                const { locks } = await fetchLockownersFile();
                const resolution = resolvePathForSync(pathParam, locks);

                if (resolution.action === 'error') {
                    await sendEphemeralResult(interaction, resolution.message);
                    return;
                }

                const collaborators = await listCollaborators();

                if (!collaborators || collaborators.length === 0) {
                    await sendEphemeralResult(
                        interaction,
                        '❌ **Échec** — Aucun collaborateur trouvé sur ce dépôt GitHub.',
                    );
                    return;
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
                await sendEphemeralResult(interaction, `❌ **Échec** — ${error.message}`);
            }
            return;
        }

        if (!interaction.isButton()) return;

        const session = getSession(interaction.user.id);
        if (!session) {
            await interaction.reply({
                content: '❌ **Échec** — Session expirée. Cliquez à nouveau sur le message épinglé.',
                ephemeral: true,
            });
            scheduleEphemeralCleanup(interaction);
            return;
        }

        const toggleLogin = parseToggleLogin(interaction.customId);

        if (toggleLogin) {
            if (!session.logins.includes(toggleLogin)) {
                await interaction.reply({ content: '❌ **Échec** — Collaborateur inconnu.', ephemeral: true });
                scheduleEphemeralCleanup(interaction);
                return;
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
                await sendEphemeralResult(
                    interaction,
                    `❌ **Échec** — Erreur API GitHub : ${error.message}`,
                );
            }
        }
    },
};
