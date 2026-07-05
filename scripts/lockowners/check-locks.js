const { PROJECT_ROOT, loadEnv } = require('../lib/env');
const { readLockownersFile } = require('../lib/lockowners');
const { ADMIN_USER } = require('./lib/constants');
const { getModifiedFiles } = require('./lib/git-diff');
const { hasLockFileModification, findAccessViolations } = require('./lib/access');

loadEnv();

const actor = process.env.GITHUB_ACTOR;

console.log(`👤 Système de sécurité — Acteur GitHub détecté : @${actor}`);

if (actor === ADMIN_USER) {
    console.log('👑 Accès Administrateur accordé. Les vérifications de verrouillage sont ignorées.');
    process.exit(0);
}

const modifiedFiles = getModifiedFiles(PROJECT_ROOT);

if (modifiedFiles === null) {
    console.log("ℹ️ Impossible de calculer le diff (il s'agit probablement d'un premier commit ou d'un push initial).");
    process.exit(0);
}

if (hasLockFileModification(modifiedFiles)) {
    console.error(`❌ SÉCURITÉ : Seul l'administrateur @${ADMIN_USER} a le droit de modifier le fichier .lockowners.`);
    process.exit(1);
}

const locks = readLockownersFile();

if (!locks) {
    console.log('ℹ️ Aucun fichier .lockowners détecté à la racine. Fin du contrôle.');
    process.exit(0);
}

const violations = findAccessViolations(modifiedFiles, actor, locks);

for (const { file, lock } of violations) {
    const ownersList = lock.owners.map(o => `@${o}`).join(', ');
    console.error(`❌ ACCÈS REFUSÉ : Le fichier ou dossier "${file}" est verrouillé par ${ownersList}.`);
}

if (violations.length > 0) {
    console.error('\n🚨 Le push contient des modifications non autorisées. Opération annulée par la CI.');
    process.exit(1);
}

console.log('✅ Félicitations : Tous les fichiers modifiés respectent la politique de verrouillage du projet.');
process.exit(0);
