# Stride — suivi de course (version GitHub Pages)

Application statique HTML/CSS/JavaScript, sans PHP ni serveur applicatif. Elle peut être publiée directement sur GitHub Pages.

## Publication sur GitHub Pages

1. Décompresser l'archive.
2. Copier **le contenu du dossier `course_tracker`** à la racine du dépôt GitHub (le fichier `index.html` doit être à la racine).
3. Dans GitHub : **Settings → Pages**.
4. Dans **Build and deployment**, choisir **Deploy from a branch**, sélectionner `main` et `/ (root)`, puis enregistrer.
5. Attendre la publication et ouvrir l'URL GitHub Pages affichée.

## Données et sauvegardes

- Les courses sont enregistrées dans le stockage local du navigateur (`localStorage`).
- Elles ne sont pas envoyées à GitHub et ne sont pas synchronisées entre appareils ou navigateurs.
- Utiliser régulièrement **Exporter JSON** pour télécharger une sauvegarde.
- Sur un autre navigateur/appareil, ou après avoir vidé les données du navigateur, utiliser **Importer JSON** pour restaurer la sauvegarde.
- L'import fusionne les courses à partir de leur identifiant ; une course portant le même identifiant est mise à jour.
- Ne pas déposer de sauvegarde personnelle dans un dépôt GitHub public.

## Fonctions

- Saisie et modification des courses, suppression individuelle.
- Tableau de bord, graphiques, comparaison de deux sorties et historique.
- Suggestions de lieux déjà saisis.
- Géolocalisation et météo via les services Open-Meteo (connexion Internet nécessaire).
- Calcul de l'allure/vitesse lorsque les données nécessaires sont disponibles.
- Saisie ou génération des tours kilométriques.
- Import/export des données au format JSON.

## Limites

La version GitHub Pages est entièrement côté navigateur : les données restent dans le navigateur utilisé. Le site ne peut pas écrire dans un fichier JSON du dépôt GitHub. L'import Samsung Health n'est pas encore intégré ; pour le moment, les données doivent être saisies manuellement.
