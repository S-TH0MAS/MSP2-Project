#!/usr/bin/env node
/**
 * Build Vite du bot Discord standalone → scripts/discord/dist/
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');
const { execSync } = require('child_process');
const { parse } = require('dotenv');

const DISCORD_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(DISCORD_DIR, 'dist');
const OUT_FILE = path.join(DIST_DIR, 'index.js');
const GZ_FILE = `${OUT_FILE}.gz`;
const VITE_CONFIG = path.join(__dirname, 'vite.config.mjs');
const ENV_FILE = path.join(DISCORD_DIR, '../../.env');
const REQUIRED_VARS = ['DISCORD_BOT_TOKEN', 'GITHUB_TOKEN'];

function prependShebang(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.startsWith('#!')) return;

    fs.writeFileSync(filePath, `#!/usr/bin/env node\n${content}`);
}

async function compressBundle() {
    await pipeline(
        fs.createReadStream(OUT_FILE),
        zlib.createGzip({ level: 9 }),
        fs.createWriteStream(GZ_FILE),
    );
}

function loadEnvForBuild() {
    if (!fs.existsSync(ENV_FILE)) {
        console.error(`❌ Fichier .env introuvable : ${ENV_FILE}`);
        console.error('   Créez-le à la racine du projet avant de lancer le build.');
        process.exit(1);
    }

    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const parsed = parse(envContent);
    const missing = REQUIRED_VARS.filter(key => !parsed[key]);

    if (missing.length > 0) {
        console.error(`❌ Variables manquantes dans .env : ${missing.join(', ')}`);
        process.exit(1);
    }

    return envContent;
}

async function build() {
    const envContent = loadEnvForBuild();

    console.log('⏳ Bundle Vite en cours (variables .env incluses)...');

    execSync(`npx vite build --config "${VITE_CONFIG}"`, {
        cwd: DISCORD_DIR,
        stdio: 'inherit',
        env: {
            ...process.env,
            MSP2_BUNDLED_DOTENV: envContent,
        },
    });

    if (!fs.existsSync(OUT_FILE)) {
        throw new Error(`Fichier attendu introuvable : ${OUT_FILE}`);
    }

    prependShebang(OUT_FILE);
    fs.chmodSync(OUT_FILE, 0o755);

    console.log('⏳ Compression gzip...');
    await compressBundle();

    const jsSize = fs.statSync(OUT_FILE).size;
    const gzSize = fs.statSync(GZ_FILE).size;

    console.log('');
    console.log('✅ Build terminé :');
    console.log(`   ${OUT_FILE} (${(jsSize / 1024).toFixed(1)} Ko)`);
    console.log(`   ${GZ_FILE} (${(gzSize / 1024).toFixed(1)} Ko)`);
    console.log('');
    console.log('⚠️  Les secrets du .env sont intégrés dans index.js — ne partagez pas ce fichier.');
    console.log('');
    console.log('📦 Déploiement : gunzip -k index.js.gz && node index.js');
}

build().catch(error => {
    console.error('❌ Échec du build :', error);
    process.exit(1);
});
