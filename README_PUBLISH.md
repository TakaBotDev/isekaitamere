# Publier un nouveau chapitre sur GitHub Pages

Le site lit les chapitres depuis `chapters.json`.

## Fichiers à garder à la racine
- `index.html`
- `app.js`
- `style.css`
- `chapters.json`
- `.nojekyll`

## Ajouter un chapitre
1. Ouvre `chapters.json` dans ton dépôt GitHub.
2. Clique sur l’icône crayon.
3. Dans le tableau `chapters`, ajoute un nouvel objet.
4. Modifie :
   - `id`
   - `number`
   - `title`
   - `content`
5. Clique sur **Commit changes**.

## Important
- Chaque chapitre doit avoir un `id` unique.
- Le texte du chapitre doit rester sur une seule ligne JSON.
- Pour séparer les paragraphes, utilise `\n\n`.

## Exemple
```json
{
  "id": 2,
  "number": 2,
  "title": "Le retour",
  "content": "Premier paragraphe...\n\nDeuxième paragraphe..."
}
```
