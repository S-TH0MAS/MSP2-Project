const { MessageFlags } = require('discord.js');

const EPHEMERAL_FLAG = MessageFlags.Ephemeral;

function withEphemeral(options = {}) {
    const { ephemeral: _removed, flags, ...rest } = options;
    return {
        ...rest,
        flags: (flags ?? 0) | EPHEMERAL_FLAG,
    };
}

module.exports = {
    EPHEMERAL_FLAG,
    withEphemeral,
};
