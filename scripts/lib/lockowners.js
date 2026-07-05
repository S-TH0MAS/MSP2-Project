const fs = require('fs');
const path = require('path');
const { PROJECT_ROOT } = require('./env');

const LOCKOWNERS_FILENAME = '.lockowners';

function normalizePath(p) {
    return p.trim().replace(/\/$/, '');
}

function parseLockowners(content) {
    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => {
            const parts = line.split(/\s+/);
            if (parts.length < 2) return null;
            return {
                pattern: normalizePath(parts[0]),
                owners: parts.slice(1).map(o => o.replace('@', '')),
            };
        })
        .filter(Boolean);
}

function isUnderOrEqual(filePath, pattern) {
    const normalized = normalizePath(filePath);
    const entry = normalizePath(pattern);
    return normalized === entry || normalized.startsWith(`${entry}/`);
}

function findLockForFile(filePath, locks) {
    return locks.find(lock => isUnderOrEqual(filePath, lock.pattern));
}

function isActorAuthorized(filePath, actor, locks) {
    const lock = findLockForFile(filePath, locks);
    if (!lock) return true;
    return lock.owners.includes(actor);
}

function readLockownersFile(lockFilePath = path.join(PROJECT_ROOT, LOCKOWNERS_FILENAME)) {
    if (!fs.existsSync(lockFilePath)) return null;
    return parseLockowners(fs.readFileSync(lockFilePath, 'utf8'));
}

module.exports = {
    LOCKOWNERS_FILENAME,
    normalizePath,
    parseLockowners,
    isUnderOrEqual,
    findLockForFile,
    isActorAuthorized,
    readLockownersFile,
};
