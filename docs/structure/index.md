# Structure

Organisation générale du dépôt MSP2-Project : dossiers, rôles et conventions.

## Vue d'ensemble

Le projet est en **phase de conception**. La structure ci-dessous évoluera au fil de l'ajout du code, des tests et de la configuration.

```
MSP2-Project/
├── README.md         Point d'entrée du dépôt
├── docs/             Documentation (arborescence index.md)
├── scripts/          Scripts utilitaires (automatisation, outillage)
├── .env.example      Modèle des variables d'environnement
└── …                 À définir (src/, tests/, config/, etc.)
```

## Dossiers principaux

| Dossier | Rôle |
|---------|------|
| `README.md` | Présentation du projet et lien vers la documentation |
| `docs/` | Documentation structurée du projet |
| `scripts/` | Scripts d'automatisation et d'infrastructure |
| `docs/conception/` | Documents de conception (présentations, specs) |
| `.env` / `.env.example` | Variables d'environnement locales — voir [docs/env](../env/index.md) |

## Sous-sections

| Section | Description |
|---------|-------------|
| [Docs](docs/index.md) | Organisation de la documentation et conventions |
| [Scripts](scripts/index.md) | Scripts utilitaires du projet |

## Évolution prévue

- structure du code source (`src/`, packages, modules) ;
- dossiers de configuration et d'environnement ;
- conventions de nommage ;
- liens vers les spécifications fonctionnelles et techniques.
