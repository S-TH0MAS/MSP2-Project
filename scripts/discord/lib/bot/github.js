const { Octokit } = require('@octokit/rest');
const { parseLockowners } = require('../../../lib/lockowners');

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

async function appendLockownersLine(pathParam, owners, octokit = getOctokit()) {
    const { fileSha, currentContent } = await fetchLockownersFile(octokit);
    const ownersString = owners.map(username => `@${username}`).join(' ');
    const newLockLine = `${pathParam} ${ownersString}`;
    const updatedContent = currentContent ? `${currentContent}\n${newLockLine}` : newLockLine;

    await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: LOCK_FILE_PATH,
        branch: BRANCH,
        message: `chore(security): verrous multiples pour ${pathParam} depuis Discord`,
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
    appendLockownersLine,
};
