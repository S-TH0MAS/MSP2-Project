# Scripts

Scripts utilitaires du projet : automatisation, outillage et tâches d'infrastructure hors code applicatif.

## Arborescence

```
scripts/
├── lib/                    # Partagé (env, lockowners)
├── discord/
│   ├── configure.js
│   ├── bot-server.js
│   ├── deploy-commands.js
│   ├── config/
│   ├── commands/
│   ├── lib/
│   │   ├── sync/
│   │   └── bot/
│   ├── build/
│   └── dist/
└── lockowners/
    ├── check-locks.js
    └── lib/
```

## Sous-sections

| Section | Description |
|---------|-------------|
| [Lib partagée](lib/index.md) | Modules communs à Discord et Lockowners |
| [Discord](discord/index.md) | Infrastructure Discord, bot, build standalone |
| [Lockowners](lockowners/index.md) | Contrôle d'accès Git via `.lockowners` |
