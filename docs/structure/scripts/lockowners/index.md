# Lockowners

Contrôle d'accès Git : vérifie que les fichiers modifiés respectent les verrous définis dans `.lockowners`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `scripts/lockowners/check-locks.js` | Script de vérification des droits sur les fichiers modifiés |
| `.lockowners` | Liste des chemins verrouillés et de leurs propriétaires (racine du dépôt) |
| `.env` | Pseudo GitHub local pour `npm run lockowners` (non versionné) |
| `.env.example` | Modèle des variables d'environnement |

## Prérequis

| Élément | Détail |
|---------|--------|
| Node.js | Environnement d'exécution |
| `dotenv` | Chargement du `.env` en local (`devDependencies`) |
| Git | Historique requis pour le `git diff HEAD~1 HEAD` |
| `GITHUB_ACTOR` | Pseudo GitHub de l'auteur du push (CI ou `.env` local) |

## Fonctionnement

Le script `check-locks.js` :

1. **Administrateur** — si `GITHUB_ACTOR` correspond à l'admin (`S-TH0MAS`), toutes les vérifications sont ignorées ;
2. **Diff Git** — liste les fichiers modifiés entre `HEAD~1` et `HEAD` ;
3. **Protection `.lockowners`** — seul l'administrateur peut modifier ce fichier ;
4. **Verrous** — chaque chemin dans `.lockowners` est réservé à un ou plusieurs propriétaires ;
5. **Verdict** — code de sortie `1` si un accès non autorisé est détecté (échec CI).

## Configuration (`.lockowners`)

Format par ligne — un ou plusieurs propriétaires par chemin :

```
chemin/ou/dossier @Pseudo1 @Pseudo2
```

| Ligne | Signification |
|-------|---------------|
| `scripts/discord/ @S-TH0MAS` | Seul @S-TH0MAS peut modifier `scripts/discord/` |
| `scripts/lockowners/ @S-TH0MAS @collaborateur` | @S-TH0MAS ou @collaborateur peuvent modifier `scripts/lockowners/` |

Les lignes commençant par `#` sont ignorées.

## Exécution

**En local :**

```bash
cp .env.example .env   # renseigner GITHUB_ACTOR
npm run lockowners
```

**En CI :**

Exécuté automatiquement par le workflow `.github/workflows/infrastructure-gitops.yml` (job `check-security-locks`) avant la synchronisation Discord. `GITHUB_ACTOR` est fourni par `${{ github.actor }}`.
