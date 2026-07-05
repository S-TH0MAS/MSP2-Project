# Scripts

Scripts utilitaires du projet : automatisation, outillage et tâches d'infrastructure hors code applicatif.

## Rôle

Le dossier `scripts/` regroupe les scripts exécutables manuellement ou en CI pour faciliter la gestion du projet. Ils ne font pas partie du code source de l'application.

```
scripts/
├── discord/
│   ├── configure.js
│   └── data.js
└── lockowners/
    └── check-locks.js
```

## Sous-sections

| Section | Description |
|---------|-------------|
| [Discord](discord/index.md) | Déploiement de l'infrastructure Discord (salons, synchronisation de fichiers) |
| [Lockowners](lockowners/index.md) | Contrôle d'accès Git via `.lockowners` |
