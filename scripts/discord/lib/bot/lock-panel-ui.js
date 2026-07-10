const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const OPEN_LOCK_MODAL = 'open_lock_modal';

const LOCK_PANEL_CONTENT = [
    '### 🛡️ Verrous dynamiques — MSP2-Project',
    '',
    '**Le problème**',
    'En développement, les agents IA ont tendance à modifier des fichiers sans tenir compte de qui en est responsable. Si personne ne surveille, un agent peut altérer le code d\'un collègue et casser une structure logique — source de bugs difficiles à diagnostiquer.',
    '',
    '**La solution**',
    'Les verrous (`.lockowners`) permettent de **bloquer dynamiquement** un fichier ou un dossier. Seuls les propriétaires listés peuvent le modifier. Chaque développeur gère ses zones : créer, retirer ou **réattribuer** un verrou à d\'autres collaborateurs si nécessaire.',
    '',
    '**Avant chaque push**',
    'Lancez `npm run lockowners` pour vérifier que votre commit reste dans les fichiers autorisés. Des outils viendront étendre cette vérification **directement avant le commit**.',
    '',
    '**Astuce** — Pour verrouiller une zone **même pour vous-même** (empêcher un agent de la modifier), assignez **uniquement** `@S-TH0MAS` comme propriétaire. C\'est le compte bot : personne ne développe dessus, donc aucun commit ne pourra toucher ces fichiers tant que le verrou est actif.',
    '',
    '👇 Cliquez ci-dessous pour synchroniser un verrou.',
    '',
    '_Message épinglé — vos actions restent visibles uniquement par vous._',
].join('\n');

function buildLockPanelPayload() {
    const button = new ButtonBuilder()
        .setCustomId(OPEN_LOCK_MODAL)
        .setLabel('🔒 Synchroniser un verrou')
        .setStyle(ButtonStyle.Primary);

    return {
        content: LOCK_PANEL_CONTENT,
        components: [new ActionRowBuilder().addComponents(button)],
    };
}

module.exports = {
    OPEN_LOCK_MODAL,
    LOCK_PANEL_CONTENT,
    buildLockPanelPayload,
};
