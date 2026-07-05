const fs = require('fs');
const path = require('path');
const { PROJECT_ROOT } = require('../../../lib/env');

const DISCORD_FILE_PATTERN = /^(.+)\.([^.]+)\.discord\.([^.]+)$/;

function getSyncKeys(syncFiles) {
    if (!syncFiles) return [];
    return Array.isArray(syncFiles) ? syncFiles : [syncFiles];
}

function walkDir(dir, files = []) {
    if (!fs.existsSync(dir)) return files;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkDir(fullPath, files);
        } else {
            files.push(fullPath);
        }
    }
    return files;
}

function parseDiscordFile(fileName) {
    const match = fileName.match(DISCORD_FILE_PATTERN);
    if (!match) return null;
    return { baseName: match[1], key: match[2], ext: match[3] };
}

function indexFilesByKey(filesDir) {
    const dirPath = path.resolve(PROJECT_ROOT, filesDir);
    const byKey = new Map();

    for (const filePath of walkDir(dirPath)) {
        const parsed = parseDiscordFile(path.basename(filePath));
        if (!parsed) continue;

        if (!byKey.has(parsed.key)) byKey.set(parsed.key, []);
        byKey.get(parsed.key).push(filePath);
    }

    return byKey;
}

function getLocalFileNames(chanData, filesByKey) {
    const names = new Set();

    for (const key of getSyncKeys(chanData.sync_files)) {
        for (const filePath of filesByKey.get(key) || []) {
            names.add(path.basename(filePath));
        }
    }

    return names;
}

function isManagedAttachment(fileName, syncKeys) {
    const parsed = parseDiscordFile(fileName);
    return parsed !== null && syncKeys.includes(parsed.key);
}

module.exports = {
    DISCORD_FILE_PATTERN,
    getSyncKeys,
    walkDir,
    parseDiscordFile,
    indexFilesByKey,
    getLocalFileNames,
    isManagedAttachment,
};
