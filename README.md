# Slime Adventure - Jeu de Plateforme

Un jeu de plateforme 2D créé avec HTML5 Canvas et JavaScript, utilisant les tilesets fournis.

## Fonctionnalités

- **Joueur contrôlable** avec physique réaliste (gravité, saut)
- **Ennemis Slime animés** avec intelligence de patrouille
- **Système de niveaux** avec plateformes et collisions
- **Système de score et vies**
- **Animations fluides** utilisant les sprites de slime

## Contrôles

- **← →** : Déplacer le personnage
- **ESPACE** : Sauter
- **R** : Recommencer la partie

## Comment jouer

1. Ouvrez `index.html` dans votre navigateur web
2. Utilisez les flèches pour vous déplacer et ESPACE pour sauter
3. Évitez les slimes ou sautez sur leur tête pour les éliminer
4. Gagnez 100 points par slime éliminé
5. Vous avez 3 vies - ne tombez pas et évitez de toucher les slimes!

## Installation

Aucune installation nécessaire! Il suffit d'ouvrir le fichier `index.html` dans un navigateur moderne.

Pour un serveur local (recommandé):

```bash
# Avec Python 3
python -m http.server 8000

# Puis ouvrez http://localhost:8000 dans votre navigateur
```

## Structure du projet

- `index.html` - Page principale du jeu
- `game.js` - Moteur de jeu et logique
- `Tileset/` - Ressources graphiques
  - `tileset.png` - Tuiles de terrain
  - `vegetation.png` - Décorations végétales
  - `slime/` - Sprites animés des slimes (5 frames)

## Technologies utilisées

- HTML5 Canvas
- JavaScript ES6+
- CSS3

## Améliorations futures possibles

- Ajout de plus de niveaux
- Power-ups et objets à collecter
- Sons et musique
- Nouveaux types d'ennemis
- Système de checkpoints
- Mode multijoueur local

Bon jeu!
