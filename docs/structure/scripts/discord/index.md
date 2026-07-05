# Discord

Script de configuration automatique du serveur Discord du projet.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `scripts/discord/configure.js` | Déploie catégories, salons et synchronise les fichiers |
| `scripts/discord/data.js` | Configuration Discord et constante `FILES_DIR` |

## Prérequis

| Élément | Détail |
|---------|--------|
| Node.js | Environnement d'exécution |
| `discord.js` | Dépendance de développement (`package.json`) |
| `DISCORD_BOT_TOKEN` | Token du bot Discord (variable d'environnement) |
| `DISCORD_GUILD_ID` | Identifiant du serveur cible (variable d'environnement) |
| Git | Recommandé — le message Discord reprend la description du dernier commit |

## Fonctionnement

Le script `configure.js` :

1. **Catégories & salons** — crée l'infrastructure définie dans `data.js` ;
2. **Recherche de fichiers** — parcourt récursivement `FILES_DIR` (`docs/`) ;
3. **Filtrage par mot-clé** — sélectionne les fichiers nommés `filename.{mot-clé}.discord.ext` ;
4. **Envoi Discord** — téléverse chaque fichier dans le salon configuré avec le mot-clé correspondant ;
5. **Message** — contenu = description du dernier commit Git du fichier.

Les fichiers déjà présents dans l'historique complet du salon (même nom de pièce jointe) ne sont pas renvoyés.

## Convention de nommage

```
filename.{mot-clé}.discord.{extension}
```

| Exemple | Mot-clé | Salon cible |
|---------|---------|-------------|
| `first_preview.init.discord.pdf` | `init` | 🚀┃initialisation |
| `specs.conception.discord.pdf` | `conception` | 📝┃conception |

## Configuration (`data.js`)

| Champ | Description |
|-------|-------------|
| `FILES_DIR` | Dossier racine de recherche des fichiers (défaut : `docs`) |
| `name` | Nom de la catégorie ou du salon |
| `type` | `'text'` (défaut) ou `'voice'` |
| `read_only` | Si `true`, interdit l'envoi de messages au rôle `@everyone` |
| `sync_files` | Liste de **mots-clés métier** (ex. `['init']`) |

```js
const FILES_DIR = 'docs';

sync_files: ['init'],  // envoie *.init.discord.* vers ce salon
```

### Catégories configurées

| Catégorie | Salons |
|-----------|--------|
| 🏠 GENERAL | 💬┃chat, 📊┃suivie-du-projet (lecture seule), 🔊┃chat-audio-general (vocal) |
| 💡 CONCEPTION | 🚀┃initialisation (`init`), 📝┃conception (`conception`) |

## Exécution

```bash
DISCORD_BOT_TOKEN=... DISCORD_GUILD_ID=... node scripts/discord/configure.js
```

Le script se déconnecte automatiquement une fois la synchronisation terminée.
