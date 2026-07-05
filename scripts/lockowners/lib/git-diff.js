const { execSync } = require('child_process');

function getModifiedFiles(projectRoot) {
    try {
        const output = execSync('git diff --name-only HEAD~1 HEAD', {
            cwd: projectRoot,
            encoding: 'utf8',
        }).trim();

        return output ? output.split('\n') : [];
    } catch {
        return null;
    }
}

module.exports = {
    getModifiedFiles,
};
