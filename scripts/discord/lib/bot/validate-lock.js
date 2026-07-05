const { normalizePath, isUnderOrEqual } = require('../../../lib/lockowners');

function validatePath(pathParam, locks) {
    const normalized = normalizePath(pathParam);

    if (!normalized) {
        return { valid: false, message: '❌ **Échec** — Le chemin fourni est vide.' };
    }

    for (const lock of locks) {
        if (normalized === lock.pattern) {
            return {
                valid: false,
                message: `❌ **Échec** — Le chemin \`${normalized}\` possède déjà un verrou.`,
            };
        }

        if (isUnderOrEqual(normalized, lock.pattern)) {
            return {
                valid: false,
                message: `❌ **Échec** — \`${normalized}\` est déjà couvert par le verrou \`${lock.pattern}\`.`,
            };
        }

        if (isUnderOrEqual(lock.pattern, normalized)) {
            return {
                valid: false,
                message: `❌ **Échec** — \`${normalized}\` engloberait le verrou existant \`${lock.pattern}\`.`,
            };
        }
    }

    return { valid: true, normalized };
}

module.exports = {
    validatePath,
};
