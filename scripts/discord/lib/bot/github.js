const { Octokit } = require('@octokit/rest');
const { parseLockowners, normalizePath } = require('../../../lib/lockowners');

const REPO_OWNER = 'S-TH0MAS';
const REPO_NAME = 'MSP2-Project';
const LOCK_FILE_PATH = '.lockowners';
const BRANCH = 'dev';

function getOctokit() {
    return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

async function fetchLockownersFile(octokit = getOctokit()) {
    let fileSha;
    let currentContent = '';

    try {
        const { data } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: LOCK_FILE_PATH,
            ref: BRANCH,
        });
        fileSha = data.sha;
        currentContent = Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (err) {
        if (err.status !== 404) throw err;
    }

    return {
        fileSha,
        currentContent,
        locks: parseLockowners(currentContent),
    };
}

async function listCollaborators(octokit = getOctokit()) {
    const { data } = await octokit.repos.listCollaborators({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        per_page: 25,
    });
    return data;
}

function applyLockSync(content, pathParam, owners) {
    const normalized = normalizePath(pathParam);
    const ownerSuffix = owners.map(username => `@${username}`).join(' ');
    const lines = content.length > 0 ? content.split('\n') : [];
    const result = [];
    let replaced = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
            result.push(line);
            continue;
        }

        const parts = trimmed.split(/\s+/);
        if (parts.length < 2) {
            result.push(line);
            continue;
        }

        const pattern = normalizePath(parts[0]);

        if (pattern === normalized) {
            replaced = true;
            if (owners.length > 0) {
                result.push(`${normalized} ${ownerSuffix}`);
            }
            continue;
        }

        result.push(line);
    }

    if (!replaced && owners.length > 0) {
        result.push(`${normalized} ${ownerSuffix}`);
    }

    return result.join('\n').replace(/\s+$/, '');
}

async function syncLockownersLine(pathParam, owners, octokit = getOctokit()) {
    const { fileSha, currentContent } = await fetchLockownersFile(octokit);
    const updatedContent = applyLockSync(currentContent, pathParam, owners);
    const isRemoval = owners.length === 0;
    const message = isRemoval
        ? `chore(security): retrait du verrou ${pathParam} depuis Discord`
        : `chore(security): sync verrous pour ${pathParam} depuis Discord`;

    await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: LOCK_FILE_PATH,
        branch: BRANCH,
        message,
        content: Buffer.from(updatedContent).toString('base64'),
        sha: fileSha,
    });
}

module.exports = {
    REPO_OWNER,
    REPO_NAME,
    LOCK_FILE_PATH,
    BRANCH,
    getOctokit,
    fetchLockownersFile,
    listCollaborators,
    applyLockSync,
    syncLockownersLine,
};
