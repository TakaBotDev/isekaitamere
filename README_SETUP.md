# Version GitHub Pages + Decap CMS

Cette version garde ton site public, et ajoute un vrai espace auteur sur `/admin/`.

## Fichiers importants
- `index.html` : le site public
- `chapters.json` : les données du site
- `admin/index.html` : l’interface Decap CMS
- `admin/config.yml` : la configuration du CMS

## Ce que tu dois remplacer dans `admin/config.yml`
Remplace :
- `TON-PSEUDO-GITHUB/NOM-DU-REPO`
- `https://TON-AUTH.workers.dev`

## Publication sur GitHub Pages
1. Mets tous les fichiers à la racine du repo, avec le dossier `admin/`.
2. Active GitHub Pages sur la branche `main` et le dossier `/ (root)`.
3. Une fois le site en ligne, ton interface auteur sera accessible à :
   - `https://ton-site.github.io/admin/`

## Authentification Decap
Pour GitHub Pages, il te faut un petit service OAuth séparé.
Le plus simple est d’utiliser un proxy OAuth déployé sur Cloudflare Workers, puis de mettre son URL dans `base_url`.

## Après configuration
Quand tu te connectes à `/admin/` :
- tu modifies l’introduction
- tu ajoutes / supprimes / édites des chapitres
- Decap committe les changements directement dans ton repo GitHub
- GitHub Pages republie le site

## Structure des chapitres
Le site lit directement `chapters.json`, donc chaque sauvegarde dans Decap mettra à jour le site public après le déploiement GitHub Pages.
