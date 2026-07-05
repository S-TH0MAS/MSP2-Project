# Docs

Organisation de la documentation du projet et règles pour la faire évoluer.

## Principe

La documentation suit une **arborescence de fichiers `index.md`** :

1. Le **README** à la racine est le point d'entrée unique.
2. Le dossier **`docs/`** contient la documentation structurée.
3. **Chaque dossier** possède un **`index.md`** qui :
   - présente le contenu du dossier ;
   - liste les liens vers les sous-dossiers ;
   - renvoie vers des fichiers détaillés si nécessaire.

## Règles

| Règle | Détail |
|-------|--------|
| Un `index.md` par dossier | Obligatoire dans chaque dossier de la doc |
| Liens relatifs | Chemins relatifs (`../`, `./`) pour la portabilité |
| Index parent → enfants | Chaque `index.md` supérieur liste ses sous-dossiers |
| Noms courts | Un mot par dossier lorsque c'est possible |
| Contenu détaillé à part | Specs, guides et annexes dans des fichiers dédiés |

## Ajouter une section

1. Créer un sous-dossier dans le dossier parent.
2. Y ajouter un `index.md`.
3. Mettre à jour l'`index.md` parent avec le lien.
4. Si la section est majeure, l'ajouter au README racine.

## Prochaines sections

Exemples de branches à ajouter sous `docs/` :

- `architecture/` — architecture logicielle ;
- `specs/` — exigences fonctionnelles et techniques ;
- `guides/` — contribution, installation, déploiement.
