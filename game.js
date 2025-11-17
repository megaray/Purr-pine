// Slime Adventure - Platformer Game
// Configuration du jeu
const CONFIG = {
    TILE_SIZE: 32,
    GRAVITY: 0.5,
    JUMP_FORCE: -12,
    PLAYER_SPEED: 4,
    ENEMY_SPEED: 1,
    MAP_WIDTH: 25,
    MAP_HEIGHT: 19
};

// Gestionnaire de ressources
class ResourceManager {
    constructor() {
        this.images = {};
        this.loaded = 0;
        this.total = 0;
    }

    loadImage(name, path) {
        this.total++;
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                this.loaded++;
                resolve(img);
            };
            img.onerror = reject;
            img.src = path;
        });
    }

    async loadAll() {
        const resources = [
            { name: 'tileset', path: 'Tileset/tileset.png' },
            { name: 'vegetation', path: 'Tileset/vegetation.png' },
            { name: 'slime1', path: 'Tileset/slime/slime_f1.png' },
            { name: 'slime2', path: 'Tileset/slime/slime_f2.png' },
            { name: 'slime3', path: 'Tileset/slime/slime_f3.png' },
            { name: 'slime4', path: 'Tileset/slime/slime_f4.png' },
            { name: 'slime5', path: 'Tileset/slime/slime_f5.png' },
            { name: 'warriorRun', path: 'Tileset/warrior/warrior run.png' },
            { name: 'warriorRoll', path: 'Tileset/warrior/warrior rolling.png' },
            { name: 'warriorDeath', path: 'Tileset/warrior/warrior death.png' }
        ];

        await Promise.all(resources.map(r => this.loadImage(r.name, r.path)));
    }

    get(name) {
        return this.images[name];
    }
}

// Classe pour gérer les animations
class Animation {
    constructor(frames, frameRate = 10) {
        this.frames = frames;
        this.frameRate = frameRate;
        this.currentFrame = 0;
        this.frameTimer = 0;
    }

    update(deltaTime) {
        this.frameTimer += deltaTime;
        if (this.frameTimer >= 1000 / this.frameRate) {
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
            this.frameTimer = 0;
        }
    }

    getCurrentFrame() {
        return this.frames[this.currentFrame];
    }

    reset() {
        this.currentFrame = 0;
        this.frameTimer = 0;
    }
}

// Classe de base pour les entités
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    collidesWith(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        return a.left < b.right && a.right > b.left &&
               a.top < b.bottom && a.bottom > b.top;
    }
}

// Classe joueur
class Player extends Entity {
    constructor(x, y, resourceManager) {
        super(x, y, 28, 28);
        this.resourceManager = resourceManager;
        this.jumpPressed = false;
        this.facing = 1; // 1 = droite, -1 = gauche

        // Animations
        this.currentAnimation = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 120; // ms par frame

        // Sprite sheet info
        this.spriteWidth = 16;
        this.spriteHeight = 16;
        this.displayWidth = 40;  // Taille d'affichage plus grande
        this.displayHeight = 40;
    }

    update(keys, tilemap, deltaTime) {
        // Déplacement horizontal
        this.vx = 0;
        let isMoving = false;

        if (keys['ArrowLeft']) {
            this.vx = -CONFIG.PLAYER_SPEED;
            this.facing = -1;
            isMoving = true;
        }
        if (keys['ArrowRight']) {
            this.vx = CONFIG.PLAYER_SPEED;
            this.facing = 1;
            isMoving = true;
        }

        // Saut
        if (keys[' '] && this.onGround && !this.jumpPressed) {
            this.vy = CONFIG.JUMP_FORCE;
            this.jumpPressed = true;
        }
        if (!keys[' ']) {
            this.jumpPressed = false;
        }

        // Gravité
        this.vy += CONFIG.GRAVITY;

        // Limitation de la vitesse de chute
        if (this.vy > 15) this.vy = 15;

        // Application de la vitesse
        this.x += this.vx;
        this.handleCollisionX(tilemap);

        this.y += this.vy;
        this.handleCollisionY(tilemap);

        // Mise à jour de l'animation
        if (isMoving && this.onGround) {
            this.currentAnimation = 'run';
        } else if (!this.onGround) {
            this.currentAnimation = 'roll';
        } else {
            this.currentAnimation = 'idle';
        }

        this.updateAnimation(deltaTime);
    }

    handleCollisionX(tilemap) {
        const bounds = this.getBounds();
        const tiles = tilemap.getTilesInBounds(bounds);

        for (const tile of tiles) {
            if (tile.solid) {
                const tileBounds = {
                    left: tile.x * CONFIG.TILE_SIZE,
                    right: (tile.x + 1) * CONFIG.TILE_SIZE,
                    top: tile.y * CONFIG.TILE_SIZE,
                    bottom: (tile.y + 1) * CONFIG.TILE_SIZE
                };

                if (bounds.left < tileBounds.right && bounds.right > tileBounds.left &&
                    bounds.top < tileBounds.bottom && bounds.bottom > tileBounds.top) {

                    if (this.vx > 0) {
                        this.x = tileBounds.left - this.width;
                    } else if (this.vx < 0) {
                        this.x = tileBounds.right;
                    }
                    this.vx = 0;
                }
            }
        }
    }

    handleCollisionY(tilemap) {
        const bounds = this.getBounds();
        const tiles = tilemap.getTilesInBounds(bounds);
        this.onGround = false;

        for (const tile of tiles) {
            if (tile.solid) {
                const tileBounds = {
                    left: tile.x * CONFIG.TILE_SIZE,
                    right: (tile.x + 1) * CONFIG.TILE_SIZE,
                    top: tile.y * CONFIG.TILE_SIZE,
                    bottom: (tile.y + 1) * CONFIG.TILE_SIZE
                };

                if (bounds.left < tileBounds.right && bounds.right > tileBounds.left &&
                    bounds.top < tileBounds.bottom && bounds.bottom > tileBounds.top) {

                    if (this.vy > 0) {
                        this.y = tileBounds.top - this.height;
                        this.onGround = true;
                    } else if (this.vy < 0) {
                        this.y = tileBounds.bottom;
                    }
                    this.vy = 0;
                }
            }
        }
    }

    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;

        let maxFrames = 8; // run animation
        if (this.currentAnimation === 'roll') {
            maxFrames = 6;
        } else if (this.currentAnimation === 'idle') {
            maxFrames = 4; // utilise les 4 premières frames de run pour idle
        }

        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % maxFrames;
            this.animationTimer = 0;
        }
    }

    draw(ctx) {
        let spriteSheet = this.resourceManager.get('warriorRun');
        let frameX = this.animationFrame % 4; // 4 frames par ligne
        let frameY = Math.floor(this.animationFrame / 4);

        if (this.currentAnimation === 'roll') {
            spriteSheet = this.resourceManager.get('warriorRoll');
            frameX = this.animationFrame % 2; // 2 frames par ligne pour rolling
            frameY = Math.floor(this.animationFrame / 2);
        } else if (this.currentAnimation === 'idle') {
            spriteSheet = this.resourceManager.get('warriorRun');
            frameX = 0;
            frameY = 0;
        }

        if (spriteSheet) {
            ctx.save();

            // Calculer la position centrée pour que le sprite soit centré sur la hitbox
            const offsetX = (this.displayWidth - this.width) / 2;
            const offsetY = (this.displayHeight - this.height) / 2;
            const drawX = this.x - offsetX;
            const drawY = this.y - offsetY;

            // Flip horizontal si on regarde à gauche
            if (this.facing === -1) {
                ctx.scale(-1, 1);
                ctx.drawImage(
                    spriteSheet,
                    frameX * this.spriteWidth,
                    frameY * this.spriteHeight,
                    this.spriteWidth,
                    this.spriteHeight,
                    -(drawX + this.displayWidth),
                    drawY,
                    this.displayWidth,
                    this.displayHeight
                );
            } else {
                ctx.drawImage(
                    spriteSheet,
                    frameX * this.spriteWidth,
                    frameY * this.spriteHeight,
                    this.spriteWidth,
                    this.spriteHeight,
                    drawX,
                    drawY,
                    this.displayWidth,
                    this.displayHeight
                );
            }

            ctx.restore();

            // DEBUG: Afficher la hitbox (à commenter en production)
            // ctx.strokeStyle = 'red';
            // ctx.strokeRect(this.x, this.y, this.width, this.height);
        } else {
            // Fallback si le sprite n'est pas chargé
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Classe ennemie (Slime)
class Slime extends Entity {
    constructor(x, y, resourceManager) {
        super(x, y, 32, 32);
        this.resourceManager = resourceManager;
        this.animation = new Animation([
            'slime1', 'slime2', 'slime3', 'slime4', 'slime5'
        ], 8);
        this.direction = 1;
        this.vx = CONFIG.ENEMY_SPEED;
        this.patrolDistance = 100;
        this.startX = x;
        this.active = true;
    }

    update(deltaTime, tilemap) {
        if (!this.active) return;

        this.animation.update(deltaTime);

        // Mouvement de patrouille
        this.x += this.vx;

        if (Math.abs(this.x - this.startX) > this.patrolDistance) {
            this.direction *= -1;
            this.vx *= -1;
        }

        // Gravité
        this.vy += CONFIG.GRAVITY;
        this.y += this.vy;

        // Collision avec le sol
        const bounds = this.getBounds();
        const tiles = tilemap.getTilesInBounds(bounds);

        for (const tile of tiles) {
            if (tile.solid) {
                const tileBounds = {
                    left: tile.x * CONFIG.TILE_SIZE,
                    right: (tile.x + 1) * CONFIG.TILE_SIZE,
                    top: tile.y * CONFIG.TILE_SIZE,
                    bottom: (tile.y + 1) * CONFIG.TILE_SIZE
                };

                if (bounds.left < tileBounds.right && bounds.right > tileBounds.left &&
                    bounds.top < tileBounds.bottom && bounds.bottom > tileBounds.top) {

                    if (this.vy > 0) {
                        this.y = tileBounds.top - this.height;
                        this.vy = 0;
                    }
                }
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const frame = this.animation.getCurrentFrame();
        const img = this.resourceManager.get(frame);

        if (img) {
            ctx.save();
            if (this.direction === -1) {
                ctx.scale(-1, 1);
                ctx.drawImage(img, -this.x - this.width, this.y, this.width, this.height);
            } else {
                ctx.drawImage(img, this.x, this.y, this.width, this.height);
            }
            ctx.restore();
        }
    }
}

// Classe Tilemap
class Tilemap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = this.generateMap();
        this.decorations = this.generateDecorations();
    }

    generateMap() {
        const map = [];

        // Génération d'un niveau simple
        for (let y = 0; y < this.height; y++) {
            map[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Sol principal
                if (y >= 15) {
                    map[y][x] = { type: 1, solid: true };
                }
                // Plateformes
                else if (y === 12 && x >= 5 && x <= 8) {
                    map[y][x] = { type: 1, solid: true };
                }
                else if (y === 10 && x >= 12 && x <= 15) {
                    map[y][x] = { type: 1, solid: true };
                }
                else if (y === 8 && x >= 18 && x <= 21) {
                    map[y][x] = { type: 1, solid: true };
                }
                // Vide
                else {
                    map[y][x] = { type: 0, solid: false };
                }
            }
        }

        return map;
    }

    generateDecorations() {
        const decorations = [];

        // Ajouter des plantes sur le sol
        const flowerPositions = [2, 7, 11, 16, 20, 23];
        for (const x of flowerPositions) {
            decorations.push({
                x: x,
                y: 14,
                type: 'flower',
                spriteX: Math.floor(Math.random() * 3) * 16,
                spriteY: 32
            });
        }

        // Ajouter des champignons
        const mushroomPositions = [4, 14, 19];
        for (const x of mushroomPositions) {
            decorations.push({
                x: x,
                y: 14,
                type: 'mushroom',
                spriteX: 48,
                spriteY: 32
            });
        }

        // Ajouter quelques stalactites en haut
        const stalactitePositions = [3, 8, 13, 17, 22];
        for (const x of stalactitePositions) {
            decorations.push({
                x: x,
                y: 0,
                type: 'stalactite',
                spriteX: Math.floor(Math.random() * 4) * 16,
                spriteY: 0
            });
        }

        return decorations;
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return { type: 0, solid: false };
        }
        return { ...this.tiles[y][x], x, y };
    }

    getTilesInBounds(bounds) {
        const tiles = [];
        const startX = Math.floor(bounds.left / CONFIG.TILE_SIZE);
        const endX = Math.floor(bounds.right / CONFIG.TILE_SIZE);
        const startY = Math.floor(bounds.top / CONFIG.TILE_SIZE);
        const endY = Math.floor(bounds.bottom / CONFIG.TILE_SIZE);

        for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
                const tile = this.getTile(x, y);
                if (tile.solid) {
                    tiles.push(tile);
                }
            }
        }

        return tiles;
    }

    // Détermine quel type de tuile utiliser selon les voisins
    getAutoTileIndex(x, y) {
        const hasTop = this.getTile(x, y - 1).solid;
        const hasBottom = this.getTile(x, y + 1).solid;
        const hasLeft = this.getTile(x - 1, y).solid;
        const hasRight = this.getTile(x + 1, y).solid;

        // Tuile pleine (entourée)
        if (hasTop && hasBottom && hasLeft && hasRight) {
            return { sx: 1, sy: 1 }; // Centre
        }
        // Surface supérieure
        else if (!hasTop && hasBottom) {
            if (!hasLeft && hasRight) return { sx: 0, sy: 0 }; // Coin supérieur gauche
            else if (hasLeft && !hasRight) return { sx: 2, sy: 0 }; // Coin supérieur droit
            else if (hasLeft && hasRight) return { sx: 1, sy: 0 }; // Bord supérieur
            else return { sx: 0, sy: 0 }; // Tuile isolée
        }
        // Surface inférieure
        else if (hasTop && !hasBottom) {
            if (!hasLeft && hasRight) return { sx: 0, sy: 2 }; // Coin inférieur gauche
            else if (hasLeft && !hasRight) return { sx: 2, sy: 2 }; // Coin inférieur droit
            else if (hasLeft && hasRight) return { sx: 1, sy: 2 }; // Bord inférieur
            else return { sx: 1, sy: 2 };
        }
        // Bord gauche
        else if (!hasLeft && hasRight && hasTop && hasBottom) {
            return { sx: 0, sy: 1 };
        }
        // Bord droit
        else if (hasLeft && !hasRight && hasTop && hasBottom) {
            return { sx: 2, sy: 1 };
        }
        // Tuile seule (plateforme)
        else if (!hasTop && !hasBottom) {
            if (!hasLeft && hasRight) return { sx: 0, sy: 0 };
            else if (hasLeft && !hasRight) return { sx: 2, sy: 0 };
            else if (hasLeft && hasRight) return { sx: 1, sy: 0 };
            else return { sx: 3, sy: 0 }; // Tuile unique
        }

        return { sx: 1, sy: 1 }; // Défaut
    }

    draw(ctx, resourceManager) {
        const tileset = resourceManager.get('tileset');
        const vegetation = resourceManager.get('vegetation');

        // Dessiner le background avec les tuiles sombres (partie haute du tileset)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const px = x * CONFIG.TILE_SIZE;
                const py = y * CONFIG.TILE_SIZE;

                // Utiliser la partie sombre du tileset pour le background
                if (tileset) {
                    const bgX = (x % 3) * 16;
                    const bgY = (y % 3) * 16;
                    ctx.drawImage(
                        tileset,
                        bgX, bgY, 16, 16,
                        px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE
                    );
                }
            }
        }

        // Dessiner les tuiles de terrain (partie claire du tileset - bas à droite)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const px = x * CONFIG.TILE_SIZE;
                const py = y * CONFIG.TILE_SIZE;

                if (tile.type === 1) {
                    if (tileset) {
                        const autoTile = this.getAutoTileIndex(x, y);
                        // Utiliser la partie claire (bas à droite) pour les plateformes
                        // Offset de 48 pixels vers la droite et 32 pixels vers le bas
                        const tileX = 48 + (autoTile.sx * 16);
                        const tileY = 32 + (autoTile.sy * 16);

                        ctx.drawImage(
                            tileset,
                            tileX, tileY, 16, 16,
                            px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE
                        );
                    } else {
                        ctx.fillStyle = '#8B4513';
                        ctx.fillRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                        ctx.strokeStyle = '#654321';
                        ctx.strokeRect(px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
                    }
                }
            }
        }

        // Dessiner les décorations
        if (vegetation) {
            for (const deco of this.decorations) {
                const px = deco.x * CONFIG.TILE_SIZE;
                const py = deco.y * CONFIG.TILE_SIZE;

                ctx.drawImage(
                    vegetation,
                    deco.spriteX, deco.spriteY, 16, 16,
                    px, py, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE
                );
            }
        }
    }
}

// Classe principale du jeu
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resourceManager = new ResourceManager();

        this.keys = {};
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;

        this.lastTime = 0;

        this.setupControls();
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') e.preventDefault();
            if (e.key === 'r' || e.key === 'R') {
                this.reset();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    async init() {
        console.log('Chargement des ressources...');
        await this.resourceManager.loadAll();
        console.log('Ressources chargées!');

        this.reset();
        this.start();
    }

    reset() {
        this.tilemap = new Tilemap(CONFIG.MAP_WIDTH, CONFIG.MAP_HEIGHT);
        this.player = new Player(100, 100, this.resourceManager);
        this.enemies = [
            new Slime(200, 400, this.resourceManager),
            new Slime(400, 300, this.resourceManager),
            new Slime(600, 250, this.resourceManager)
        ];
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.updateUI();
    }

    start() {
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (this.gameOver) return;

        // Mise à jour du joueur
        this.player.update(this.keys, this.tilemap, deltaTime);

        // Mise à jour des ennemis
        for (const enemy of this.enemies) {
            enemy.update(deltaTime, this.tilemap);

            // Collision joueur-ennemi
            if (enemy.active && this.player.collidesWith(enemy)) {
                // Si le joueur tombe sur l'ennemi
                if (this.player.vy > 0 && this.player.y < enemy.y) {
                    enemy.active = false;
                    this.player.vy = CONFIG.JUMP_FORCE * 0.5;
                    this.score += 100;
                    this.updateUI();
                } else {
                    // Le joueur est touché
                    this.lives--;
                    this.updateUI();
                    if (this.lives <= 0) {
                        this.gameOver = true;
                    } else {
                        // Réapparition
                        this.player.x = 100;
                        this.player.y = 100;
                        this.player.vx = 0;
                        this.player.vy = 0;
                    }
                }
            }
        }

        // Vérifier si le joueur tombe hors de l'écran
        if (this.player.y > this.canvas.height) {
            this.lives--;
            this.updateUI();
            if (this.lives <= 0) {
                this.gameOver = true;
            } else {
                this.player.x = 100;
                this.player.y = 100;
                this.player.vx = 0;
                this.player.vy = 0;
            }
        }
    }

    draw() {
        // Le tilemap gère maintenant le fond complet
        this.tilemap.draw(this.ctx, this.resourceManager);

        // Ennemis
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // Joueur
        this.player.draw(this.ctx);

        // Game Over
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px PixelStorm, Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '24px PixelStorm, Arial';
            this.ctx.fillText('Appuyez sur R pour recommencer', this.canvas.width / 2, this.canvas.height / 2 + 50);
            this.ctx.fillText('Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 90);
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
    }
}

// Démarrage du jeu
const game = new Game();
game.init();
