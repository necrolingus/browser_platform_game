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
    var winScreen   = document.getElementById('win-screen');
    var winStats    = document.getElementById('win-stats');
    var mobileScreen = document.getElementById('mobile-screen');

    // --- Mobile / touch detection — block gameplay on touch-only devices ---
    var isMobile = (function () {
        var ua = navigator.userAgent || '';
        var touchOnly = ('ontouchstart' in window) && !window.matchMedia('(pointer: fine)').matches;
        var uaMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        return touchOnly || uaMobile;
    })();
    if (isMobile) {
        mobileScreen.classList.remove('hidden');
        startScreen.classList.add('hidden');
    }

    // --- State ---
    var state = 'start'; // 'start' | 'playing' | 'dead' | 'won'
    var input, camera, player, level, enemies, gems, bullets, acidPlants;
    var boss = null;
    var arenaBounds = null;
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
        acidPlants = SpaceBoy.generateAcidPlants(level1Data);

        // --- Boss + arena (level 1 = alien saucer) ---
        arenaBounds = SpaceBoy.getBossArenaBounds();
        boss = new SpaceBoy.Boss(level1Data.bossType || 'alien_saucer', arenaBounds);

        score = 0;
        gemsCollected = 0;
        resetKillTracker();
        SpaceBoy.clearEnemyParticles();
        SpaceBoy.Background.generate();
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
        if (isMobile) return; // gameplay blocked on touch-only devices
        if (state === 'start') {
            startScreen.classList.add('hidden');
            startGame();
        } else if (state === 'dead') {
            deathScreen.classList.add('hidden');
            startGame();
        } else if (state === 'won') {
            winScreen.classList.add('hidden');
            startGame();
        }
    }
    startScreen.addEventListener('click', onScreenClick);
    deathScreen.addEventListener('click', onScreenClick);
    winScreen.addEventListener('click', onScreenClick);

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

        // --- Acid plants ---
        for (var ap = 0; ap < acidPlants.length; ap++) {
            var plant = acidPlants[ap];
            plant.update(dt);

            // Solid body collision — push player out horizontally so they must jump over
            if (aabb(player, plant)) {
                var playerCenter = player.x + player.width / 2;
                var plantCenter = plant.x + plant.width / 2;
                if (playerCenter < plantCenter) {
                    player.x = plant.x - player.width;
                } else {
                    player.x = plant.x + plant.width;
                }
                player.vx = 0;
            }

            if (player.alive && plant.hitsPlayer(player)) {
                player.kill();
            }
        }

        if (player.y > LEVEL.HEIGHT_PX + 100) {
            player.kill();
        }

        // --- Boss arena gate ---
        // Once the player crosses into the arena, lock the camera to the arena
        // left edge and prevent the player walking back out. Activates the boss.
        var inArena = player.x + player.width / 2 >= arenaBounds.x;
        if (inArena && boss && !boss.active && boss.alive) {
            boss.activate();
        }
        if (inArena) {
            // Lock player inside arena bounds
            if (player.x < arenaBounds.x) { player.x = arenaBounds.x; player.vx = 0; }
        }

        if (player.x < 0) { player.x = 0; player.vx = 0; }
        if (player.x + player.width > LEVEL.WIDTH_PX) {
            player.x = LEVEL.WIDTH_PX - player.width;
            player.vx = 0;
        }

        // --- Camera ---
        if (inArena) {
            // Lock camera to arena screen
            camera.x = arenaBounds.x;
            camera.y = 0;
        } else {
            camera.follow(player);
            // Also clamp so the camera never reveals the arena early
            if (camera.x + GAME.CANVAS_WIDTH > arenaBounds.x) {
                camera.x = arenaBounds.x - GAME.CANVAS_WIDTH;
            }
        }

        // --- Boss ---
        if (boss) {
            boss.update(dt, player);

            // Player contact with living boss body = take damage
            if (player.alive && boss.alive && !boss._dying && boss.active && aabb(player, boss.rect())) {
                player.takeDamage();
            }

            // Boss bullets hitting player
            if (player.alive && boss.checkBulletHitsPlayer(player)) {
                player.takeDamage();
            }
        }

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

            // Bullet vs boss
            if (boss && boss.alive && !boss._dying && boss.active) {
                var br = boss.rect();
                if (circleRect(b.x, b.y, bulletRadius, br.x, br.y, br.width, br.height)) {
                    var bossKilled = boss.takeDamage(b.damage);
                    if (bossKilled) {
                        score += boss.scoreValue;
                    }
                    bullets.splice(i, 1);
                    continue;
                }
            }
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

        // --- Win (boss fully defeated, including death animation) ---
        if (boss && !boss.alive && player.alive && state === 'playing') {
            state = 'won';
            showWinScreen();
        }
    }

    function showWinScreen() {
        // Build a stat summary
        var totalKills = 0;
        var lines = [];
        var typeNames = { walker: 'Walkers', charger: 'Chargers', flyer: 'Flyers' };
        for (var key in killTracker) {
            if (killTracker.hasOwnProperty(key)) {
                totalKills += killTracker[key];
                lines.push((typeNames[key] || key) + ': ' + killTracker[key]);
            }
        }
        var html = '';
        html += '<div>Score: <span style="color:#ffcc33">' + score + '</span></div>';
        html += '<div>Gems: <span style="color:#00ffaa">' + gemsCollected + '</span></div>';
        html += '<div>Total Kills: <span style="color:#ff6666">' + totalKills + '</span></div>';
        html += '<div style="margin-top:6px; font-size:13px; color:#88a;">' + lines.join(' &nbsp;·&nbsp; ') + '</div>';
        html += '<div style="margin-top:6px;">Boss: <span style="color:#ff88aa">DEFEATED</span></div>';
        winStats.innerHTML = html;
        winScreen.classList.remove('hidden');
    }

    function render() {
        // Clear + space background
        ctx.fillStyle = GAME.BACKGROUND_COLOR;
        ctx.fillRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);
        SpaceBoy.Background.draw(ctx, camera);

        // Level tiles
        level.draw(ctx, camera);

        // Acid plants (behind enemies/player, on top of tiles)
        for (var ap = 0; ap < acidPlants.length; ap++) acidPlants[ap].draw(ctx, camera);

        // Gems
        for (var g = 0; g < gems.length; g++) gems[g].draw(ctx, camera);

        // Enemies
        for (var e = 0; e < enemies.length; e++) enemies[e].draw(ctx, camera);

        // Boss (drawn before enemy particles so explosions can layer over)
        if (boss) boss.draw(ctx, camera);

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
