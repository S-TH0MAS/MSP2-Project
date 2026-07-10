# Discord

Scripts d'infrastructure et bot Discord du projet MSP2-Project.

## Arborescence

```
scripts/discord/
├── configure.js          # CI — déploie salons et synchronise les fichiers
├── bot-server.js           # Dev — bot persistant (/lock-panel)
├── deploy-commands.js      # Enregistre les commandes slash
├── config/
│   └── data.js             # Catégories, salons, mots-clés sync
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

## Modules `lib/bot/` (runtime)

| Module | Rôle |
|--------|------|
| `env.js` | Variables Discord (`scripts/lib/env` + validation) |
| `commands.js` | Chargement des commandes slash |
| `lock-sync.js` | Résolution du chemin (parent / exact / libre) pour la sync |
| `github.js` | API GitHub — lecture/écriture `.lockowners` (sync) |
| `owner-selection.js` | UI tableau de sélection des propriétaires |

Les fonctions communes (`.env`, parse `.lockowners`) sont dans `scripts/lib/`.

## `/lock-panel` — synchronisation des verrous

1. Saisie d'un chemin fichier ou dossier.
2. **Parent existant** — erreur avec le chemin du verrou parent.
3. **Verrou exact** — panneau sync avec propriétaires pré-sélectionnés (ajout/retrait).
4. **Aucun verrou** — panneau sync vide (création).
5. **Validation sans propriétaire** — suppression de la ligne dans `.lockowners`.
6. **Enfants existants** — erreur si le chemin engloberait des verrous plus spécifiques.

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
| `GITHUB_TOKEN` | `/lock-panel`, build standalone |

## `configure.js` — synchronisation

1. Crée l'infrastructure définie dans `config/data.js`
2. Parcourt `FILES_DIR` (`docs/`) pour les fichiers `filename.{mot-clé}.discord.ext`
3. Envoie les pièces jointes dans le salon correspondant au mot-clé
4. Supprime les messages dont le fichier local a disparu
5. Contenu du message = description du dernier commit Git

## Configuration (`config/data.js`)

| Champ | Description |
|-------|-------------|
| `FILES_DIR` | Racine de recherche (défaut : `docs`) |
| `name` | Nom catégorie ou salon |
| `type` | `'text'` ou `'voice'` |
| `read_only` | Interdit l'envoi de messages à `@everyone` |
| `sync_files` | Mots-clés métier (`['init']`, etc.) |

### Salons configurés

| Catégorie | Salons |
|-----------|--------|
| 🏠 GENERAL | 💬┃chat, 📊┃suivie-du-projet (lecture seule), 🔊┃chat-audio-general |
| 💡 CONCEPTION | 🚀┃initialisation (`init`), 📝┃conception (`conception`) |

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
