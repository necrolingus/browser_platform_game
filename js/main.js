// =============================================================================
// Space Boy! — Main entry point & game loop
// =============================================================================

(function () {
    var GAME   = SpaceBoy.GAME;
    var BULLET = SpaceBoy.BULLET;
    var SUPER  = SpaceBoy.SUPER_BULLET;
    var MEGA   = SpaceBoy.MEGA_BULLET;
    var ENEMY  = SpaceBoy.ENEMY;
    var GEM_CONST = SpaceBoy.GEM;
    var TILE   = SpaceBoy.TILE;
    var LEVEL  = SpaceBoy.LEVEL;
    var LEVELS = SpaceBoy.LEVELS;

    var Input   = SpaceBoy.Input;
    var Camera  = SpaceBoy.Camera;
    var Player  = SpaceBoy.Player;
    var Level   = SpaceBoy.Level;
    var Walker  = SpaceBoy.Walker;
    var Charger = SpaceBoy.Charger;
    var Flyer   = SpaceBoy.Flyer;
    var Dasher  = SpaceBoy.Dasher;
    var Frogger = SpaceBoy.Frogger;
    var SpaceGem = SpaceBoy.SpaceGem;
    var drawHUD = SpaceBoy.drawHUD;
    var moveX       = SpaceBoy.moveX;
    var moveY       = SpaceBoy.moveY;
    var checkLava   = SpaceBoy.checkLava;
    var aabb        = SpaceBoy.aabb;
    var circleRect  = SpaceBoy.circleRect;

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
    var winMessage  = document.getElementById('win-message');
    var winNextBtn  = document.getElementById('win-next-btn');
    var storyScreen = document.getElementById('story-screen');
    var storyText   = document.getElementById('story-text');
    var storyBtn    = document.getElementById('story-btn');
    var storyHints  = document.getElementById('story-hints');
    var comingSoonScreen = document.getElementById('coming-soon-screen');
    var comingSoonText   = document.getElementById('coming-soon-text');
    var mobileScreen = document.getElementById('mobile-screen');

    // --- Mobile / touch detection ---
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
    // 'start' | 'story' | 'coming_soon' | 'playing' | 'dead' | 'won'
    var state = 'start';
    var input, camera, player, level, enemies, gems, bullets, acidPlants;
    var boss = null;
    var arenaBounds = null;
    var score = 0;
    var gemsCollected = 0;
    var lastTime = 0;

    var currentLevelNum = 1;
    var currentLevelCfg = null;

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

    function getLevelData(levelCfg) {
        return SpaceBoy[levelCfg.DATA_KEY];
    }

    function initLevel(levelNum) {
        currentLevelNum = levelNum;
        currentLevelCfg = LEVELS[levelNum];

        // Resize the global LEVEL singleton for the chosen level so that
        // camera/spawner/level/etc. all see the right dimensions.
        SpaceBoy.applyLevelDimensions(currentLevelCfg);

        // Apply (or restore) per-level terrain palette overrides so levels
        // can have their own visual theme (e.g. monochrome for level 3).
        SpaceBoy.applyTerrainOverride(currentLevelCfg.TERRAIN_OVERRIDE);

        var data = getLevelData(currentLevelCfg);

        // Validate + generate enemies/acid plants for this level
        SpaceBoy.validateLevel(data);
        data.enemies = SpaceBoy.generateEnemies(data, currentLevelCfg.SPAWN);

        level = new Level(data);
        camera = new Camera();
        player = new Player(level.spawnX, level.spawnY);
        player.setWeapons(currentLevelCfg.WEAPONS);
        player.showHair = (levelNum >= 2);
        bullets = [];
        enemies = spawnEnemies(level.enemyDefs);
        gems = spawnGems(level.gemDefs);
        acidPlants = SpaceBoy.generateAcidPlants(data, currentLevelCfg.ACID_PLANTS);

        // Acid plants are placed after gems are spawned, so a gem can end up
        // sitting inside a plant's body where the player can never reach it.
        // Lift any overlapping gems above the plant so they remain collectable.
        relocateGemsAwayFromPlants(gems, acidPlants);

        // --- Boss + arena (only if this level has a boss) ---
        if (currentLevelCfg.BOSS_TYPE) {
            arenaBounds = SpaceBoy.getBossArenaBounds();
            boss = new SpaceBoy.Boss(currentLevelCfg.BOSS_TYPE, arenaBounds);
        } else {
            arenaBounds = null;
            boss = null;
        }

        score = 0;
        gemsCollected = 0;
        resetKillTracker();
        SpaceBoy.clearEnemyParticles();
        SpaceBoy.clearEnemyProjectiles();
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
                case 'dasher':  return new Dasher(x, y);
                case 'frogger': return new Frogger(x, y);
                default: return new Walker(x, y);
            }
        });
    }

    // Move any gems that overlap an acid plant's body up and away so they
    // can't get stuck inside the flower where the player can't grab them.
    function relocateGemsAwayFromPlants(gemList, plantList) {
        if (!plantList || plantList.length === 0) return;
        for (var i = 0; i < gemList.length; i++) {
            var gem = gemList[i];
            for (var p = 0; p < plantList.length; p++) {
                var plant = plantList[p];
                var gemBox = { x: gem.x, y: gem.y, width: gem.size, height: gem.size };
                if (aabb(gemBox, plant)) {
                    // Lift the gem one tile above the plant's top edge.
                    gem.y = plant.y - TILE.SIZE - gem.size / 2;
                }
            }
        }
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

    // --- Menu button: checked each frame in update() ---

    // =========================================================================
    // Screen flow
    // =========================================================================
    function hideAllScreens() {
        startScreen.classList.add('hidden');
        deathScreen.classList.add('hidden');
        winScreen.classList.add('hidden');
        if (storyScreen) storyScreen.classList.add('hidden');
        if (comingSoonScreen) comingSoonScreen.classList.add('hidden');
    }

    function showStartScreen() {
        state = 'start';
        hideAllScreens();
        startScreen.classList.remove('hidden');
    }

    function showStoryScreen(levelNum) {
        var cfg = LEVELS[levelNum];
        if (!cfg.INTRO_STORY) {
            // No story — go straight in
            startGame(levelNum);
            return;
        }
        state = 'story';
        currentLevelNum = levelNum;
        hideAllScreens();
        storyText.textContent = cfg.INTRO_STORY;
        // Show new-mechanics hints only on levels that introduce them (level 2+)
        if (storyHints) {
            if (cfg.WEAPONS && cfg.WEAPONS.indexOf('mega') >= 0) {
                storyHints.classList.remove('hidden');
            } else {
                storyHints.classList.add('hidden');
            }
        }
        storyScreen.classList.remove('hidden');
    }

    function showComingSoon(levelNum) {
        var cfg = LEVELS[levelNum];
        state = 'coming_soon';
        hideAllScreens();
        comingSoonText.textContent = cfg.COMING_SOON_MESSAGE;
        comingSoonScreen.classList.remove('hidden');
    }

    function startGame(levelNum) {
        hideAllScreens();
        state = 'playing';
        initLevel(levelNum);
        lastTime = performance.now();
        canvas.focus();
        requestAnimationFrame(gameLoop);
    }

    // =========================================================================
    // Click handlers
    // =========================================================================

    // Level select buttons on start screen
    function onLevelButtonClick(e) {
        e.stopPropagation();
        if (isMobile) return;
        var levelNum = parseInt(e.currentTarget.getAttribute('data-level'), 10);
        var cfg = LEVELS[levelNum];
        if (cfg.COMING_SOON) {
            showComingSoon(levelNum);
            return;
        }
        if (cfg.INTRO_STORY) {
            showStoryScreen(levelNum);
        } else {
            startGame(levelNum);
        }
    }

    var levelBtns = document.querySelectorAll('#start-screen .level-btn');
    for (var i = 0; i < levelBtns.length; i++) {
        levelBtns[i].addEventListener('click', onLevelButtonClick);
    }

    // Story screen "Start Mission" button
    if (storyBtn) {
        storyBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            startGame(currentLevelNum);
        });
    }

    // Coming-soon screen click → back to start
    if (comingSoonScreen) {
        comingSoonScreen.addEventListener('click', function () {
            if (isMobile) return;
            showStartScreen();
        });
    }

    // Death screen → retry current level
    deathScreen.addEventListener('click', function () {
        if (isMobile) return;
        if (state !== 'dead') return;
        startGame(currentLevelNum);
    });

    // Win screen click → back to start screen
    winScreen.addEventListener('click', function () {
        if (isMobile) return;
        if (state !== 'won') return;
        showStartScreen();
    });

    // "Go to next level" button on win screen
    if (winNextBtn) {
        winNextBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (isMobile) return;
            var nextLevel = currentLevelNum + 1;
            if (LEVELS[nextLevel]) {
                if (LEVELS[nextLevel].COMING_SOON) {
                    showComingSoon(nextLevel);
                } else if (LEVELS[nextLevel].INTRO_STORY) {
                    showStoryScreen(nextLevel);
                } else {
                    startGame(nextLevel);
                }
            } else {
                showStartScreen();
            }
        });
    }

    // =========================================================================
    // Game loop
    // =========================================================================
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
        // --- Menu button click (suppress shot + return to start) ---
        if (input.lmbPressed && SpaceBoy.isMenuButtonHit(input.mouseX, input.mouseY)) {
            input.lmbPressed = false;
            input.lmbDown = false;
            showStartScreen();
            return;
        }

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

            // Solid body collision
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

        // --- Boss arena gate (only if level has a boss) ---
        if (boss && arenaBounds) {
            var inArena = player.x + player.width / 2 >= arenaBounds.x;
            if (inArena && !boss.active && boss.alive) {
                boss.activate();
            }
            if (inArena) {
                if (player.x < arenaBounds.x) { player.x = arenaBounds.x; player.vx = 0; }
            }
        }

        if (player.x < 0) { player.x = 0; player.vx = 0; }
        if (player.x + player.width > LEVEL.WIDTH_PX) {
            player.x = LEVEL.WIDTH_PX - player.width;
            player.vx = 0;
        }

        // --- Camera ---
        if (boss && arenaBounds) {
            var inArena2 = player.x + player.width / 2 >= arenaBounds.x;
            if (inArena2) {
                camera.x = arenaBounds.x;
                camera.y = 0;
            } else {
                camera.follow(player);
                if (camera.x + GAME.CANVAS_WIDTH > arenaBounds.x) {
                    camera.x = arenaBounds.x - GAME.CANVAS_WIDTH;
                }
            }
        } else {
            camera.follow(player);
        }

        // --- Boss ---
        if (boss) {
            boss.update(dt, player);
            if (player.alive && boss.alive && !boss._dying && boss.active && boss.contactTest(player)) {
                player.takeDamage();
            }
            if (player.alive) {
                var bulletHit = boss.checkBulletHitsPlayer(player);
                if (bulletHit === 'uber') {
                    player.kill();   // uber bullet = instant death
                } else if (bulletHit) {
                    player.takeDamage();
                }
            }
        }

        // --- Enemies ---
        for (var e = 0; e < enemies.length; e++) {
            var enemy = enemies[e];
            if (!enemy.alive) continue;
            // Some enemies need the player passed in
            if (enemy.type === 'charger' || enemy.type === 'dasher' || enemy.type === 'frogger') {
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

        // --- Enemy projectiles (frogger acid etc.) ---
        SpaceBoy.updateEnemyProjectiles(dt, level);
        var projs = SpaceBoy.enemyProjectiles;
        for (var pi = projs.length - 1; pi >= 0; pi--) {
            var p = projs[pi];
            if (player.alive && circleRect(p.x, p.y, p.radius, player.x, player.y, player.width, player.height)) {
                player.takeDamage();
                projs.splice(pi, 1);
            }
        }

        // --- Bullets (normal + super + mega) ---
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

            // Bullet radius — varies by type
            var bulletRadius = b.isMega ? MEGA.RADIUS : (b.isSuper ? SUPER.RADIUS : BULLET.RADIUS);

            // Bullet vs enemies
            var hit = false;
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
                    // Mega bullets pass through enemies (overkill)
                    if (!b.isMega) break;
                }
            }
            if (hit && !b.isMega) { bullets.splice(i, 1); continue; }

            // Bullet vs boss (supports multi-rect triplet bosses)
            if (boss && boss.alive && !boss._dying && boss.active) {
                if (boss.hitTest(b.x, b.y, bulletRadius)) {
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
                player.addGem();
            }
        }

        // --- Death ---
        if (!player.alive) {
            state = 'dead';
            deathScreen.classList.remove('hidden');
        }

        // --- Win conditions ---
        if (state === 'playing' && player.alive) {
            if (boss) {
                // Boss level — kill the boss
                if (!boss.alive) {
                    state = 'won';
                    showWinScreen();
                }
            } else {
                // No boss — reach the right edge of the level
                if (player.x + player.width >= LEVEL.WIDTH_PX - 4) {
                    state = 'won';
                    showWinScreen();
                }
            }
        }
    }

    function showWinScreen() {
        // Build a stat summary
        var totalKills = 0;
        var lines = [];
        var typeNames = {
            walker: 'Walkers',
            charger: 'Chargers',
            flyer: 'Flyers',
            dasher: 'Dashers',
            frogger: 'Froggers',
        };
        for (var key in killTracker) {
            if (killTracker.hasOwnProperty(key) && killTracker[key] > 0) {
                totalKills += killTracker[key];
                lines.push((typeNames[key] || key) + ': ' + killTracker[key]);
            }
        }
        var html = '';
        html += '<div>Score: <span style="color:#ffcc33">' + score + '</span></div>';
        html += '<div>Gems: <span style="color:#00ffaa">' + gemsCollected + '</span></div>';
        html += '<div>Total Kills: <span style="color:#ff6666">' + totalKills + '</span></div>';
        html += '<div style="margin-top:6px; font-size:12px; color:#88a;">' + lines.join(' &nbsp;·&nbsp; ') + '</div>';
        if (boss) {
            html += '<div style="margin-top:6px;">Boss: <span style="color:#ff88aa">DEFEATED</span></div>';
        }
        winStats.innerHTML = html;

        // Per-level win message
        if (winMessage) {
            winMessage.textContent = currentLevelCfg.WIN_MESSAGE || '';
        }

        // Show "Go to next level" button only if a real next level exists
        if (winNextBtn) {
            var next = LEVELS[currentLevelNum + 1];
            if (next && !next.COMING_SOON) {
                winNextBtn.classList.remove('hidden');
            } else {
                winNextBtn.classList.add('hidden');
            }
        }

        winScreen.classList.remove('hidden');
    }

    function render() {
        // Clear + space background
        ctx.fillStyle = GAME.BACKGROUND_COLOR;
        ctx.fillRect(0, 0, GAME.CANVAS_WIDTH, GAME.CANVAS_HEIGHT);
        SpaceBoy.Background.draw(ctx, camera);

        // Level tiles
        level.draw(ctx, camera);

        // Acid plants
        for (var ap = 0; ap < acidPlants.length; ap++) acidPlants[ap].draw(ctx, camera);

        // Gems
        for (var g = 0; g < gems.length; g++) gems[g].draw(ctx, camera);

        // Enemies
        for (var e = 0; e < enemies.length; e++) enemies[e].draw(ctx, camera);

        // Boss
        if (boss) boss.draw(ctx, camera);

        // Enemy hit particles
        SpaceBoy.drawEnemyParticles(ctx, camera);

        // Enemy projectiles (acid etc.)
        SpaceBoy.drawEnemyProjectiles(ctx, camera);

        // Bullets
        for (var i = 0; i < bullets.length; i++) {
            var b = bullets[i];
            var sx = b.x - camera.x;
            var sy = b.y - camera.y;

            if (b.isMega) {
                // Mega bullet — huge magenta glow with white-hot core
                ctx.fillStyle = MEGA.GLOW_COLOR;
                ctx.beginPath();
                ctx.arc(sx, sy, MEGA.RADIUS * 1.8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = MEGA.COLOR;
                ctx.beginPath();
                ctx.arc(sx, sy, MEGA.RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = MEGA.CORE_COLOR;
                ctx.beginPath();
                ctx.arc(sx, sy, MEGA.RADIUS * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else if (b.isSuper) {
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
        drawHUD(ctx, player, camera, score, gemsCollected, killTracker, input.mouseX, input.mouseY);
    }

    // Expose kill tracker for external access
    SpaceBoy.getKillTracker = function () { return killTracker; };
})();
