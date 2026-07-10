const EPHEMERAL_TTL_MS = 5000;

function scheduleEphemeralCleanup(interaction, delayMs = EPHEMERAL_TTL_MS) {
    setTimeout(() => {
        interaction.deleteReply().catch(() => {});
    }, delayMs);
}

module.exports = {
    EPHEMERAL_TTL_MS,
    scheduleEphemeralCleanup,
};
