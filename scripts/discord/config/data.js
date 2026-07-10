/**
 * Configuration Discord du serveur MSP2-Project.
 *
 * Dossier racine où le script recherche les fichiers à synchroniser.
 * Convention de nommage : filename.{mot-clé}.discord.{ext}
 * Exemple : first_preview.init.discord.pdf
 *
 * Champs disponibles par salon :
 *   - name        : nom du salon (obligatoire)
 *   - type        : 'text' (défaut) ou 'voice'
 *   - read_only   : true = @everyone ne peut pas envoyer de messages (salons texte)
 *   - sync_files  : liste de mots-clés métier — le script envoie les fichiers
 *                   correspondants (filename.{mot-clé}.discord.ext) trouvés dans FILES_DIR
 *   - welcome_message : texte Markdown affiché en lecture seule (message d'accueil GitOps)
 *   - landing_channel : true = salon d'accueil (premier dans la catégorie, message épinglé)
 *   - pinned_panel    : 'lock-panel' = message épinglé avec bouton d'action
 *   - audit_log       : clé du journal d'audit (ex. 'lockowners')
 *   - info_message    : clé du message d'info (voir config/info-messages.js)
 *
 * Champs disponibles par catégorie :
 *   - dev_only        : true = visible uniquement par le rôle DEV (catégorie ou salon)
 */

const FILES_DIR = 'docs';
const GITHUB_REPO_URL = 'https://github.com/S-TH0MAS/MSP2-Project';

const WELCOME_HOME = [
  '# 👋 Bienvenue sur MSP2-Project',
  '',
  'Ce serveur Discord est l\'espace de **suivi du projet** : échanges entre l\'équipe, documentation, livrables et outils du dépôt **MSP2-Project**.',
  '',
  '**Le projet** — plateforme sociale d\'**apprentissage C2C** (particulier à particulier) pour la transmission de savoir-faire entre **mentors** et **apprenants**. Actuellement en **phase de conception**.',
  '',
  '**Sur ce serveur**',
  '- **👨‍💻 DEV** — espace réservé aux développeurs (sous GENERAL)',
  '- **💡 CONCEPTION** — présentation initiale et documents de conception',
  '- **⚙️ OPTIONS & COMMANDES** — infos, verrous dynamiques (`.lockowners`)',
  '- **📋 LOGS** — historique des actions sur les verrous',
  '',
  `🔗 **Dépôt GitHub** : ${GITHUB_REPO_URL}`,
].join('\n');

module.exports = {
  FILES_DIR,
  GITHUB_REPO_URL,
  categories: [
    {
      name: '🏠 GENERAL',
      channels: [
        {
          name: '👋┃accueil',
          type: 'text',
          read_only: true,
          landing_channel: true,
          welcome_message: WELCOME_HOME,
        },
        {
          name: '💬┃chat',
          type: 'text',
        },
        {
          name: '📊┃suivie-du-projet',
          type: 'text',
          read_only: true,
        },
        {
          name: '🔊┃chat-audio-general',
          type: 'voice',
        },
      ],
    },
    {
      name: '👨‍💻 DEV',
      dev_only: true,
      channels: [
        {
          name: '💬┃chat-dev',
          type: 'text',
          dev_only: true,
        },
        {
          name: '🔊┃chat-audio-dev',
          type: 'voice',
          dev_only: true,
        },
      ],
    },
    {
      name: '💡 CONCEPTION',
      channels: [
        {
          name: '🚀┃initialisation',
          type: 'text',
          read_only: true,
          sync_files: ['init'],
        },
        {
          name: '📝┃conception',
          type: 'text',
          read_only: true,
          sync_files: ['conception'],
        },
      ],
    },
    {
      name: '⚙️ OPTIONS & COMMANDES',
      channels: [
        {
          name: 'ℹ️┃info',
          type: 'text',
          read_only: true,
          info_message: 'fileSync',
        },
        {
          name: '🔒┃lockowners',
          type: 'text',
          read_only: true,
          pinned_panel: 'lock-panel',
        },
      ],
    },
    {
      name: '📋 LOGS',
      channels: [
        {
          name: '🔒┃lockowners-logs',
          type: 'text',
          read_only: true,
          audit_log: 'lockowners',
        },
      ],
    },
  ],
};
