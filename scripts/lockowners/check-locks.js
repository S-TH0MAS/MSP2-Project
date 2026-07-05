const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
require('dotenv').config({ path: path.join(PROJECT_ROOT, '.env') });

const { execSync } = require('child_process');
const fs = require('fs');
const LOCK_FILE = path.join(PROJECT_ROOT, '.lockowners');

const ADMIN_USER = 'S-TH0MAS';

// 1. Récupérer l'acteur qui déclenche le workflow sur GitHub
const actor = process.env.GITHUB_ACTOR;

console.log(`👤 Système de sécurité — Acteur GitHub détecté : @${actor}`);

// Règle d'or absolue : l'admin a les pleins pouvoirs
if (actor === ADMIN_USER) {
    console.log("👑 Accès Administrateur accordé. Les vérifications de verrouillage sont ignorées.");
    process.exit(0);
}

// 2. Récupérer la liste des fichiers modifiés dans le push/merge actuel
let modifiedFiles = [];
try {
    // Compare le commit actuel (HEAD) avec son parent (HEAD~1)
    const output = execSync('git diff --name-only HEAD~1 HEAD', { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
    modifiedFiles = output.split('\n').filter(Boolean);
} catch (err) {
    console.log("ℹ️ Impossible de calculer le diff (il s'agit probablement d'un premier commit ou d'un push initial).");
    process.exit(0);
}

// 3. 🛡️ Sécurité anti-bypass : Empêcher un collaborateur de modifier la liste des verrous
const hasModifiedLockFile = modifiedFiles.some(file => file === '.lockowners' || file.endsWith('.lockowners'));

if (hasModifiedLockFile) {
    console.error(`❌ SÉCURITÉ : Seul l'administrateur @${ADMIN_USER} a le droit de modifier le fichier .lockowners.`);
    process.exit(1); // Fait planter le workflow immédiatement
}

// 4. Charger et analyser le fichier .lockowners si existant
if (!fs.existsSync(LOCK_FILE)) {
    console.log("ℹ️ Aucun fichier .lockowners détecté à la racine. Fin du contrôle.");
    process.exit(0);
}

const lockContent = fs.readFileSync(LOCK_FILE, 'utf8');
const locks = lockContent.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')) // Ignore les lignes vides et commentaires
    .map(line => {
        const parts = line.split(/\s+/);
        if (parts.length < 2) return null;
        return {
            pattern: parts[0].replace(/\/$/, ''),
            owners: parts.slice(1).map(p => p.replace('@', '')),
        };
    })
    .filter(Boolean);

// 5. Analyse des fichiers modifiés face aux verrous actifs
let accessDenied = false;

for (const file of modifiedFiles) {
    // Vérifie si le fichier modifié commence par un chemin verrouillé
    const matchingLock = locks.find(lock => file.startsWith(lock.pattern));

    if (matchingLock) {
        if (!matchingLock.owners.includes(actor)) {
            const ownersList = matchingLock.owners.map(o => `@${o}`).join(', ');
            console.error(`❌ ACCÈS REFUSÉ : Le fichier ou dossier "${file}" est verrouillé par ${ownersList}.`);
            accessDenied = true;
        }
    }
}

// 6. Verdict final du script
if (accessDenied) {
    console.error("\n🚨 Le push contient des modifications non autorisées. Opération annulée par la CI.");
    process.exit(1);
} else {
    console.log("✅ Félicitations : Tous les fichiers modifiés respectent la politique de verrouillage du projet.");
    process.exit(0);
}