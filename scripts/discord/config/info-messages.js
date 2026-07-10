/**
 * Messages d'information synchronisés vers les salons `info_message`.
 *
 * Structure extensible — ajoutez une clé, puis référencez-la dans `data.js` :
 *   info_message: 'maCle'
 *
 * Chaque entrée peut contenir :
 *   - title   : titre Markdown (### …)
 *   - intro   : paragraphes d'introduction (string[])
 *   - sections: blocs détaillés { heading, channel, keyword, lines }
 *   - outro   : paragraphes de fin (string[])
 */

const FILES_DIR = 'docs';

module.exports = {
    fileSync: {
        title: '### ℹ️ Publication automatique vers Discord',
        intro: [
            'Certains fichiers du dossier `docs/` du projet peuvent être **publiés automatiquement** sur Discord.',
            'Il suffit de respecter cette convention de nommage :',
            '`nom.{mot-clé}.discord.{extension}`',
            '',
            'Le bot envoie le fichier dans le salon correspondant au **mot-clé**. Si le fichier est retiré du dépôt, le message Discord est supprimé.',
        ],
        sections: [
            {
                heading: '🚀 Initialisation',
                channel: '🚀┃initialisation',
                keyword: 'init',
                lines: [
                    'Mot-clé `init` — ex. `first_preview.init.discord.pdf`',
                ],
            },
            {
                heading: '📝 Conception',
                channel: '📝┃conception',
                keyword: 'conception',
                lines: [
                    'Mot-clé `conception` — ex. `maquette.conception.discord.pdf`',
                ],
            },
        ],
        outro: [
            'Mise à jour à chaque push sur `main` ou `dev`. Les salons de publication sont en lecture seule.',
        ],
    },
};
