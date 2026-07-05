# Env

Variables d'environnement locales pour le développement sur votre machine.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `.env.example` | Modèle versionné — liste les variables sans valeurs sensibles |
| `.env` | Fichier local par développeur — **non versionné** (`.gitignore`) |

## Mise en place

```bash
cp .env.example .env
```

Renseignez ensuite les valeurs dans `.env` à la racine du projet (au même niveau que `package.json`).

## Sous-sections

| Section | Description |
|---------|-------------|
| [Sommaire](sommaire.md) | Liste des variables — nom, description, requis |

## Scripts concernés

| Script | Lien |
|--------|------|
| lockowners | [structure/scripts/lockowners](../structure/scripts/lockowners/index.md) |
