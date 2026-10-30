# Stride — carnet de course

Application web PHP + JavaScript avec stockage JSON serveur.

## Installation
1. Copier le dossier `course_tracker` dans le répertoire web de l'hébergement (par exemple `/volume1/web/`).
2. Vérifier que PHP est activé pour le site et que le processus PHP-FPM peut écrire dans `data/`.
3. Ouvrir `https://votre-domaine/course_tracker/`.
4. L'API est `api.php`; les courses sont enregistrées dans `data/runs.json`.

## Fonctionnalités
- Deux vues : tableau de bord et saisie/édition.
- Ajout, modification et suppression des courses.
- Suggestions de lieux à partir de l'historique.
- Préremplissage de distance et du profil altimétrique depuis une sortie au même lieu.
- Géocodage, altitude indicative et météo historique/du jour via Open-Meteo (sans clé API).
- Calcul d'allure ou de vitesse moyenne lorsque les données nécessaires sont disponibles.
- Tours kilométriques et dernier tronçon partiel.
- Comparaison de deux courses, écart en jours et graphique d'évolution.
- Stockage JSON dans `data/runs.json`.

## Important : données géographiques
Un simple nom de lieu ne permet pas de connaître le tracé exact d'une course. Pour un lieu déjà enregistré, distance et dénivelé sont repris de la dernière course connue. Pour un nouveau lieu, le géocodage fournit une altitude ponctuelle indicative (pas le dénivelé du parcours). Il faut donc ajuster distance, dénivelé et altitudes selon le tracé réellement couru.

## Sécurité / sauvegardes
- Le dossier `data/` doit être accessible en écriture par PHP, mais non listable publiquement.
- Le fichier `.htaccess` fourni bloque l'accès direct à `data/` sur Apache. Pour nginx, ajouter une règle équivalente dans la configuration du site.
- Sauvegarder régulièrement `data/runs.json`.
- L'application est prévue pour un usage personnel derrière HTTPS. Pour un accès public multi-utilisateur, ajouter une authentification avant mise en production.

## Format des temps
Les temps sont saisis au format `minutes:secondes`, par exemple `27:42`. Les tours sont enregistrés individuellement avec distance, temps, fréquence cardiaque et allure.
