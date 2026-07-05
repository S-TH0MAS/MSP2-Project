const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

function resolveEnvPath() {
    const scriptPath = process.argv[1];
    if (scriptPath) {
        const nextToScript = path.join(path.dirname(path.resolve(scriptPath)), '.env');
        if (fs.existsSync(nextToScript)) {
            return nextToScript;
        }
    }

    return path.join(PROJECT_ROOT, '.env');
}

function loadEnv() {
    const embedded = typeof __BUNDLED_DOTENV__ !== 'undefined' ? __BUNDLED_DOTENV__ : '';

    if (embedded) {
        const parsed = require('dotenv').parse(embedded);
        for (const [key, value] of Object.entries(parsed)) {
            if (process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
        return;
    }

    require('dotenv').config({ path: resolveEnvPath() });
}

module.exports = {
    PROJECT_ROOT,
    loadEnv,
    resolveEnvPath,
};
