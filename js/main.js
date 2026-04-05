// =============================================================================
// Space Boy! — Main entry point & game loop
// =============================================================================

(function () {
    var GAME   = SpaceBoy.GAME;
    var BULLET = SpaceBoy.BULLET;
    var SUPER  = SpaceBoy.SUPER_BULLET;
    var ENEMY  = SpaceBoy.ENEMY;
    var GEM_CONST = SpaceBoy.GEM;
    var TILE   = SpaceBoy.TILE;
    var LEVEL  = SpaceBoy.LEVEL;

    var Input   = SpaceBoy.Input;
    var Camera  = SpaceBoy.Camera;
    var Player  = SpaceBoy.Player;
    var Level   = SpaceBoy.Level;
    var Walker  = SpaceBoy.Walker;
    var Charger = SpaceBoy.Charger;
    var Flyer   = SpaceBoy.Flyer;
    var SpaceGem = SpaceBoy.SpaceGem;
    var drawHUD = SpaceBoy.drawHUD;
    var moveX       = SpaceBoy.moveX;
    var moveY       = SpaceBoy.moveY;
    var checkLava   = SpaceBoy.checkLava;
    var aabb        = SpaceBoy.aabb;
    var circleRect  = SpaceBoy.circleRect;
    var level1Data  = SpaceBoy.level1Data;

    // --- Canvas setup ---
    var canvas = document.getElementById('game-canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = GAME.CANVAS_WIDTH;
    canvas.height = GAME.CANVAS_HEIGHT;

    // --- Screens ---
    var startScreen = document.getElementById('start-screen');
    var deathScreen = document.getElementById('death-screen');

    // --- State ---
    var state = 'start'; // 'start' | 'playing' | 'dead'
    var input, camera, player, level, enemies, gems, bullets;
    var score = 0;
    var gemsCollected = 0;
    var lastTime = 0;

    // Kill tracking per enemy type
    var killTracker = {};

    function resetKillTracker() {
        killTracker = {};
        var types = SpaceBoy.ENEMY_TYPES;
        for (var key in types) {
            if (types.hasOwnProperty(key)) {
                killTracker[key] = 0;
            }
        }
    }

    function initLevel() {
        // Validate level data before loading
        SpaceBoy.validateLevel(level1Data);

        // Generate enemies dynamically from tile data
        level1Data.enemies = SpaceBoy.generateEnemies(level1Data);

        level = new Level(level1Data);
        camera = new Camera();
        player = new Player(level.spawnX, level.spawnY);
        bullets = [];
        enemies = spawnEnemies(level.enemyDefs);
        gems = spawnGems(level.gemDefs);
        score = 0;
        gemsCollected = 0;
        resetKillTracker();
        SpaceBoy.clearEnemyParticles();
    }

    function spawnEnemies(defs) {
        return defs.map(function (d) {
            var x = d.col * TILE.SIZE;
            var y = d.row * TILE.SIZE;
            switch (d.type) {
                case 'walker':  return new Walker(x, y);
                case 'charger': return new Charger(x, y);
                case 'flyer':   return new Flyer(x, y);
                default: return new Walker(x, y);
            }
        });
    }

    function spawnGems(defs) {
        return defs.map(function (d) {
            return new SpaceGem(
                d.col * TILE.SIZE + TILE.SIZE / 2 - GEM_CONST.SIZE / 2,
                d.row * TILE.SIZE + TILE.SIZE / 2 - GEM_CONST.SIZE / 2
            );
        });
    }

    // --- Input setup (persists across restarts) ---
    input = new Input(canvas);

    // --- Screen click handlers ---
    function startGame() {
        state = 'playing';
        initLevel();
        lastTime = performance.now();
        canvas.focus();
        requestAnimationFrame(gameLoop);
    }

    function onScreenClick() {
        if (state === 'start') {
            startScreen.classList.add('hidden');
            startGame();
        } else if (state === 'dead') {
            deathScreen.classList.add('hidden');
            startGame();
        }
    }
    startScreen.addEventListener('click', onScreenClick);
    deathScreen.addEventListener('click', onScreenClick);

    // --- Game loop ---
    function gameLoop(timestamp) {
        if (state !== 'playing') return;

        var dt = Math.min((timestamp - lastTime) / 1000, 0.05);
        lastTime = timestamp;

        input.update();
        update(dt);
        render();

        requestAnimationFrame(gameLoop);
    }

    function update(dt) {
        // --- Player ---
        player.update(dt, input, camera, bullets);
        moveX(player, dt, level);
        moveY(player, dt, level);

        if (checkLava(player, level)) {
            player.kill();
        }

        if (player.y > LEVEL.HEIGHT_PX + 100) {
            player.kill();
        }

        if (player.x < 0) { player.x = 0; player.vx = 0; }
        if (player.x + player.width > LEVEL.WIDTH_PX) {
            player.x = LEVEL.WIDTH_PX - player.width;
            player.vx = 0;
        }

        // --- Camera ---
        camera.follow(player);

        // --- Enemies ---
        for (var e = 0; e < enemies.length; e++) {
            var enemy = enemies[e];
            if (!enemy.alive) continue;
            if (enemy.type === 'charger') {
                enemy.update(dt, level, player);
            } else {
                enemy.update(dt, level);
            }

            if (player.alive && aabb(player, enemy)) {
                player.takeDamage();
            }
        }

        // --- Enemy particles ---
        SpaceBoy.updateEnemyParticles(dt);

        // --- Bullets (normal + super) ---
        for (var i = bullets.length - 1; i >= 0; i--) {
            var b = bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;

            if (b.life <= 0) { bullets.splice(i, 1); continue; }

            // Bullet vs solid tile
            var col = Math.floor(b.x / TILE.SIZE);
            var row = Math.floor(b.y / TILE.SIZE);
            if (level.isSolid(col, row)) { bullets.splice(i, 1); continue; }

            // Bullet vs enemies
            var hit = false;
            var bulletRadius = b.isSuper ? SUPER.RADIUS : BULLET.RADIUS;
            for (var j = 0; j < enemies.length; j++) {
                var enemy = enemies[j];
                if (!enemy.alive) continue;
                if (circleRect(b.x, b.y, bulletRadius, enemy.x, enemy.y, enemy.width, enemy.height)) {
                    var killed = enemy.takeDamage(b.damage);
                    if (killed) {
                        score += enemy.scoreValue;
                        killTracker[enemy.type] = (killTracker[enemy.type] || 0) + 1;
                        player.addKill();
                    }
                    hit = true;
                    break;
                }
            }
            if (hit) { bullets.splice(i, 1); continue; }
        }

        // --- Gems ---
        for (var g = 0; g < gems.length; g++) {
            var gem = gems[g];
            if (gem.collected) continue;
            gem.update(dt);

            var gemBox = { x: gem.x, y: gem.y, width: gem.size, height: gem.size };
            if (aabb(player, gemBox)) {
                gem.collected = true;
                gemsCollected++;
            }
        }

        // --- Death ---
        if (!player.alive) {
            state = 'dead';
            deathScreen.classList.remove('hidden');
        }
    }

    function render() {
        // Clear
        ctx.fillStyle = GAME.BACKGROUND_COLOR;
        ctx.fillRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);

        // Level tiles
        level.draw(ctx, camera);

        // Gems
        for (var g = 0; g < gems.length; g++) gems[g].draw(ctx, camera);

        // Enemies
        for (var e = 0; e < enemies.length; e++) enemies[e].draw(ctx, camera);

        // Enemy hit particles
        SpaceBoy.drawEnemyParticles(ctx, camera);

        // Bullets
        for (var i = 0; i < bullets.length; i++) {
            var b = bullets[i];
            var sx = b.x - camera.x;
            var sy = b.y - camera.y;

            if (b.isSuper) {
                // Super bullet — bigger, glowing cyan
                ctx.fillStyle = SUPER.GLOW_COLOR;
                ctx.beginPath();
                ctx.arc(sx, sy, SUPER.RADIUS * 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = SUPER.COLOR;
                ctx.beginPath();
                ctx.arc(sx, sy, SUPER.RADIUS, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = BULLET.COLOR;
                ctx.beginPath();
                ctx.arc(sx, sy, BULLET.RADIUS, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Player
        player.draw(ctx, camera);

        // HUD
        drawHUD(ctx, player, camera, score, gemsCollected, killTracker);
    }

    // Expose kill tracker for external access
    SpaceBoy.getKillTracker = function () { return killTracker; };
})();
