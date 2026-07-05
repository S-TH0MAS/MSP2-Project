# Lib partagée

Modules réutilisés par plusieurs services sous `scripts/`.

## Fichiers

| Module | Rôle |
|--------|------|
| `scripts/lib/env.js` | Racine du dépôt (`PROJECT_ROOT`) et chargement du `.env` |
| `scripts/lib/lockowners.js` | Parse `.lockowners`, normalisation des chemins, correspondance fichier ↔ verrou |

## Utilisation

| Service | Modules importés |
|---------|------------------|
| `scripts/discord/` | `lib/bot/env`, `lib/bot/github`, `lib/bot/validate-lock` ; `lib/sync/*` utilise `scripts/lib/env` |
| `scripts/lockowners/` | `env`, `lockowners` (via `check-locks.js`) |

La logique spécifique reste dans `scripts/discord/lib/sync/`, `scripts/discord/lib/bot/` ou `scripts/lockowners/lib/`.
