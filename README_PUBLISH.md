# Publier un nouveau chapitre sur GitHub Pages

Le site lit les chapitres depuis `chapters.json`.

## Ajouter un chapitre
1. Ouvre `chapters.json` dans ton dépôt GitHub.
2. Clique sur l’icône crayon pour éditer le fichier.
3. Dans le tableau `chapters`, copie le dernier bloc et colle-le à la fin.
4. Change :
   - `id`
   - `number`
   - `title`
   - `content`
5. Fais bien attention aux virgules entre les blocs JSON.
6. Clique sur **Commit changes**.

## Modifier le texte d’introduction
Dans `chapters.json`, tu peux aussi changer :
- `storyTitle`
- `storySubtitle`
- `intro`

## Exemple de nouveau chapitre
```json
{
  "id": 2,
  "number": 2,
  "title": "Le retour",
  "content": "Premier paragraphe...\n\nDeuxième paragraphe..."
}
```

## Important
- Chaque chapitre doit avoir un `id` unique.
- Sépare les paragraphes avec `\n\n`.
- Après le commit, GitHub Pages met le site à jour automatiquement.
