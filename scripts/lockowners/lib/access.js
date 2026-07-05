const { findLockForFile, LOCKOWNERS_FILENAME } = require('../../lib/lockowners');

function hasLockFileModification(modifiedFiles) {
    return modifiedFiles.some(
        file => file === LOCKOWNERS_FILENAME || file.endsWith(LOCKOWNERS_FILENAME),
    );
}

function findAccessViolations(modifiedFiles, actor, locks) {
    const violations = [];

    for (const file of modifiedFiles) {
        const lock = findLockForFile(file, locks);
        if (lock && !lock.owners.includes(actor)) {
            violations.push({ file, lock });
        }
    }

    return violations;
}

module.exports = {
    hasLockFileModification,
    findAccessViolations,
};
