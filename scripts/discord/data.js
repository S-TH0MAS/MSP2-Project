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
 */

const FILES_DIR = 'docs';

module.exports = {
  FILES_DIR,
  categories: [
    {
      name: '🏠 GENERAL',
      channels: [
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
  ],
};
