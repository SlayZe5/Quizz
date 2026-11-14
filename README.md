# Pop Quiz

## Structure
- `index.html` : point d'entrée de l'application.
- `css/style.css` : styles et thèmes visuels.
- `js/data.js` : banque de questions (`window.QUIZ_DATA`).
- `js/app.js` : logique du jeu (solo et multijoueur).

## Lancement
Ouvrir `index.html` dans un navigateur pour le mode solo.

Le multijoueur dépend de l'environnement d'origine qui fournit `claude.use("db")` et `claude.use("user")` ainsi que les droits d'accès associés. En dehors de cet environnement, le mode multijoueur peut afficher le message « Multijoueur indisponible ».
