const { execSync } = require('child_process');
const path = require('path');
const { PROJECT_ROOT } = require('../../../lib/env');

function getCommitMessage(filePath) {
    const relPath = path.relative(PROJECT_ROOT, filePath);

    try {
        const message = execSync(`git log -1 --format=%B -- "${relPath}"`, {
            cwd: PROJECT_ROOT,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();

        if (message) return message;
    } catch {
        // Pas de dépôt Git ou fichier non suivi
    }

    return `📄 ${path.basename(filePath)}`;
}

module.exports = {
    getCommitMessage,
};
