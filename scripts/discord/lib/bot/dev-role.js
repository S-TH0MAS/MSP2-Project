const DEFAULT_DEV_ROLE = 'DEV';
const { withEphemeral } = require('./reply-flags');

function getDevRoleName() {
    return process.env.DISCORD_DEV_ROLE || DEFAULT_DEV_ROLE;
}

function getMemberRoleIds(interaction) {
    const roles = interaction.member?.roles;
    if (!roles) return [];
    if (Array.isArray(roles)) return roles;
    if (roles.cache) return [...roles.cache.keys()];
    return [];
}

function hasDevRole(interaction) {
    if (!interaction.inGuild() || !interaction.guild || !interaction.member) {
        return false;
    }

    const roleName = getDevRoleName();
    const devRole = interaction.guild.roles.cache.find(role => role.name === roleName);
    if (!devRole) return false;

    return getMemberRoleIds(interaction).includes(devRole.id);
}

async function denyNoDevRole(interaction, { cleanup = true } = {}) {
    const roleName = getDevRoleName();
    const content = `❌ **Échec** — Cette action est réservée aux membres avec le rôle **${roleName}**.`;

    if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content, components: [] });
    } else {
        await interaction.reply(withEphemeral({ content }));
    }

    if (cleanup) {
        const { scheduleEphemeralCleanup } = require('./ephemeral');
        scheduleEphemeralCleanup(interaction);
    }
}

module.exports = {
    DEFAULT_DEV_ROLE,
    getDevRoleName,
    hasDevRole,
    denyNoDevRole,
};
