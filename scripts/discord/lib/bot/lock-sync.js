const { normalizePath, isUnderOrEqual } = require('../../../lib/lockowners');

function findExactLock(path, locks) {
    const normalized = normalizePath(path);
    return locks.find(lock => lock.pattern === normalized) ?? null;
}

function findParentLock(path, locks) {
    const normalized = normalizePath(path);
    return locks.find(
        lock => lock.pattern !== normalized && isUnderOrEqual(normalized, lock.pattern),
    ) ?? null;
}

function findChildLocks(path, locks) {
    const normalized = normalizePath(path);
    return locks.filter(
        lock => lock.pattern !== normalized && isUnderOrEqual(lock.pattern, normalized),
    );
}

/**
 * Détermine si le chemin peut être synchronisé ou doit être refusé.
 * @returns {{ action: 'sync', normalized: string, existingOwners: string[] } | { action: 'error', message: string }}
 */
function resolvePathForSync(pathParam, locks) {
    const normalized = normalizePath(pathParam);

    if (!normalized) {
        return { action: 'error', message: '❌ **Échec** — Le chemin fourni est vide.' };
    }

    const exact = findExactLock(normalized, locks);
    if (exact) {
        return {
            action: 'sync',
            normalized,
            existingOwners: [...exact.owners],
        };
    }

    const parent = findParentLock(normalized, locks);
    if (parent) {
        return {
            action: 'error',
            message: `❌ **Échec** — \`${normalized}\` est déjà couvert par le verrou parent \`${parent.pattern}\` (${parent.owners.map(o => `**@${o}**`).join(', ')}).`,
        };
    }

    const children = findChildLocks(normalized, locks);
    if (children.length > 0) {
        const list = children.map(lock => `\`${lock.pattern}\``).join(', ');
        return {
            action: 'error',
            message: `❌ **Échec** — \`${normalized}\` engloberait des verrous existants : ${list}.`,
        };
    }

    return {
        action: 'sync',
        normalized,
        existingOwners: [],
    };
}

module.exports = {
    findExactLock,
    findParentLock,
    findChildLocks,
    resolvePathForSync,
};
