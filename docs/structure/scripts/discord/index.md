# Discord

Scripts d'infrastructure et bot Discord du projet MSP2-Project.

## Arborescence

```
scripts/discord/
├── configure.js          # CI — déploie salons et synchronise les fichiers
├── bot-server.js           # Dev — bot persistant (/lock-panel)
├── deploy-commands.js      # Enregistre les commandes slash
├── config/
│   ├── data.js             # Catégories, salons, mots-clés sync
│   └── info-messages.js    # Messages d'info structurés (extensible)
├── commands/
│   ├── index.js            # Registre des commandes slash
│   └── lock-panel.js       # /lock-panel — verrous GitOps
├── lib/
│   ├── sync/               # Logique configure.js (infrastructure)
│   └── bot/                # Logique bot-server.js (runtime)
├── build/
│   ├── run.js              # Lance le build Vite
│   ├── standalone.mjs      # Entrée du bundle
│   ├── vite.config.mjs
│   └── stubs/              # Modules natifs optionnels (bundle)
└── dist/                   # Sortie build (gitignoré)
```

## Points d'entrée

| Script | Rôle | Commande |
|--------|------|----------|
| `configure.js` | Catégories, salons, sync fichiers `docs/` | CI ou `node scripts/discord/configure.js` |
| `bot-server.js` | Écoute les interactions Discord | `node scripts/discord/bot-server.js` |
| `deploy-commands.js` | Publie les slash commands | `node scripts/discord/deploy-commands.js` |
| `build/run.js` | Bundle standalone + `.env` intégré | `node scripts/discord/build/run.js` |

## Modules `lib/sync/` (infrastructure)

| Module | Rôle |
|--------|------|
| `channels.js` | Types de salons et permissions lecture seule |
| `files.js` | Convention `*.mot-clé.discord.*`, indexation |
| `git.js` | Message Discord = dernier commit Git |
| `messages.js` | Pagination de l'historique d'un salon |
| `sync.js` | Synchronisation fichiers ↔ messages |
| `positions.js` | Ordre des catégories et salons |
| `welcome.js` | Message d'accueil en lecture seule (GitOps) |
| `info.js` | Messages d'information structurés (GitOps) |
| `panel.js` | Panneau épinglé lockowners (bouton d'action) |

## Modules `lib/bot/` (runtime)

| Module | Rôle |
|--------|------|
| `env.js` | Variables Discord (`scripts/lib/env` + validation) |
| `commands.js` | Chargement des commandes slash |
| `lock-sync.js` | Résolution du chemin (parent / exact / libre) pour la sync |
| `github.js` | API GitHub — lecture/écriture `.lockowners` (sync) |
| `owner-selection.js` | UI tableau de sélection des propriétaires |
| `audit-log.js` | Journal des actions lockowners vers le salon LOGS |
| `channels-config.js` | Résolution des salons par configuration |
| `lock-panel-ui.js` | Contenu et bouton du panneau lockowners |
| `ephemeral.js` | Suppression auto des réponses éphémères |
| `dev-role.js` | Vérification du rôle DEV pour `/lock-panel` |

Les fonctions communes (`.env`, parse `.lockowners`) sont dans `scripts/lib/`.

## `/lock-panel` — synchronisation des verrous

**Accès** : rôle **DEV** requis (configurable via `DISCORD_DEV_ROLE` dans `.env`, défaut `DEV`).

**Point d'entrée** : message épinglé dans `🔒┃lockowners` (OPTIONS & COMMANDES).

1. Clic sur le bouton épinglé → saisie du chemin.
2. **Parent existant** — erreur avec le chemin du verrou parent.
3. **Verrou exact** — panneau sync avec propriétaires pré-sélectionnés (ajout/retrait).
4. **Aucun verrou** — panneau sync vide (création).
5. **Validation sans propriétaire** — suppression de la ligne dans `.lockowners`.
6. **Enfants existants** — erreur si le chemin engloberait des verrous plus spécifiques.

**UX** : les étapes sont **éphémères** (visibles uniquement par l'utilisateur) et le message de résultat s'efface après 5 s.

**Audit** : chaque action réussie est enregistrée dans `🔒┃lockowners-logs` (📋 LOGS), ex. `Thomaz#1234 a ajouté @S-TH0MAS sur scripts/discord/`.

## Prérequis

| Élément | Détail |
|---------|--------|
| Node.js 20+ | Environnement d'exécution |
| `discord.js`, `@octokit/rest` | `package.json` |
| `DISCORD_BOT_TOKEN` | Token du bot |
| `DISCORD_GUILD_ID` | ID du serveur (configure + deploy) |
| `GITHUB_TOKEN` | PAT GitHub (`/lock-panel`) |
| Git | Recommandé — message sync = dernier commit |

## Variables (`.env` à la racine)

| Variable | Requis pour |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Tous les scripts |
| `DISCORD_GUILD_ID` | `configure.js`, `deploy-commands.js` |
| `DISCORD_DEV_ROLE` | `/lock-panel` — nom du rôle autorisé (défaut : `DEV`) |
| `GITHUB_TOKEN` | `/lock-panel`, build standalone |

## `configure.js` — synchronisation

1. Crée l'infrastructure définie dans `config/data.js`
2. Parcourt `FILES_DIR` (`docs/`) pour les fichiers `filename.{mot-clé}.discord.ext`
3. Envoie les pièces jointes dans le salon correspondant au mot-clé
4. Supprime les messages dont le fichier local a disparu
5. Contenu du message = description du dernier commit Git

## Page d'accueil (`landing_channel`)

Le salon `👋┃accueil` est configuré avec `landing_channel: true` dans `data.js`.

**Automatique (via `configure.js`)** :
1. Placé en **premier** dans sa catégorie (et 🏠 GENERAL en première catégorie)
2. Message d'accueil synchronisé et **épinglé**

**Manuel (recommandé pour les nouveaux membres)** — nécessite un [serveur communautaire Discord](https://support.discord.com/hc/fr/articles/4403205878423) :

1. **Paramètres du serveur** → **Guide du serveur** (Onboarding)
2. Activer le guide du serveur
3. Dans **Salons par défaut**, ajouter `👋┃accueil`
4. Les nouveaux membres verront ce salon mis en avant à leur arrivée

Sans serveur communautaire, le salon reste visible en **haut de la liste** à gauche — c'est le premier qu'ils voient en ouvrant 🏠 GENERAL.

## Messages d'information (`info_message`)

Le salon `ℹ️┃info` affiche un message structuré défini dans `config/info-messages.js`.

Pour ajouter un nouveau bloc :
1. Ajouter une entrée dans `info-messages.js` (`title`, `intro`, `sections`, `outro`)
2. Référencer la clé via `info_message: 'maCle'` sur un salon read-only

Le contenu est synchronisé à chaque `configure.js` (création, mise à jour, suppression des doublons).

## Configuration (`config/data.js`)

| Champ | Description |
|-------|-------------|
| `FILES_DIR` | Racine de recherche (défaut : `docs`) |
| `name` | Nom catégorie ou salon |
| `type` | `'text'` ou `'voice'` |
| `read_only` | Interdit l'envoi de messages à `@everyone` |
| `sync_files` | Mots-clés métier (`['init']`, etc.) |
| `welcome_message` | Texte Markdown synchronisé comme message d'accueil (salon read-only) |
| `landing_channel` | Salon d'accueil : premier dans la catégorie + message épinglé |
| `pinned_panel` | Panneau épinglé (`'lock-panel'`) |
| `audit_log` | Clé du journal d'audit (`'lockowners'`) |
| `info_message` | Clé du message d'info (`config/info-messages.js`) |

### Salons configurés

| Catégorie | Salons |
|-----------|--------|
| 🏠 GENERAL | 👋┃accueil (page d'accueil), 💬┃chat, 📊┃suivie-du-projet (lecture seule), 🔊┃chat-audio-general |
| 💡 CONCEPTION | 🚀┃initialisation (`init`), 📝┃conception (`conception`) |
| ⚙️ OPTIONS & COMMANDES | ℹ️┃info (sync fichiers), 🔒┃lockowners (panneau épinglé, read-only) |
| 📋 LOGS | 🔒┃lockowners-logs (audit lockowners, read-only) |

## Build standalone

```bash
node scripts/discord/build/run.js   # lit .env racine — DISCORD_BOT_TOKEN + GITHUB_TOKEN requis
```

Produit `scripts/discord/dist/index.js` (~1,5 Mo, minifié, `.env` inclus) et `index.js.gz`.

```bash
gunzip -k index.js.gz
node index.js
```

⚠️ `index.js` contient vos tokens — ne le partagez pas. `dist/` est gitignoré.
