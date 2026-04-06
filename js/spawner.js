// =============================================================================
// Space Boy! — Enemy Spawner
// Generates enemy placements from tile data + spawn parameters.
// Replaces hand-placed enemy lists. Called during level init.
// =============================================================================

(function () {
    var TILES = SpaceBoy.TILES;
    var TILE  = SpaceBoy.TILE;
    var LEVEL = SpaceBoy.LEVEL;
    var SPAWN = SpaceBoy.ENEMY.SPAWN;

    // Seeded pseudo-random for deterministic spawns per level
    function seededRand(seed) {
        var n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return n - Math.floor(n);
    }

    function isSolid(tiles, col, row) {
        if (row < 0 || row >= tiles.length || col < 0 || col >= tiles[0].length) return false;
        var t = tiles[row][col];
        return t === TILES.GROUND || t === TILES.PLATFORM;
    }

    /**
     * Scan the tile map and find distinct platform segments.
     * A "platform" = contiguous horizontal run of solid tiles with air above.
     * Returns: [{ row, minCol, maxCol, isGround }]
     */
    function findPlatforms(tiles) {
        var H = tiles.length;
        var W = tiles[0].length;
        var platforms = [];
        var visited = {};

        // Ground rows are the bottom 2 rows (14-15 typically)
        var groundRows = {};
        groundRows[H - 2] = true;
        groundRows[H - 1] = true;

        for (var r = 0; r < H; r++) {
            for (var c = 0; c < W; c++) {
                var key = r + ',' + c;
                if (visited[key]) continue;
                if (!isSolid(tiles, c, r)) continue;
                if (isSolid(tiles, c, r - 1)) continue; // not a top surface

                // Found a top-surface tile, expand left/right
                var minCol = c;
                var maxCol = c;
                while (maxCol + 1 < W && isSolid(tiles, maxCol + 1, r) && !isSolid(tiles, maxCol + 1, r - 1)) {
                    maxCol++;
                }

                for (var cc = minCol; cc <= maxCol; cc++) {
                    visited[r + ',' + cc] = true;
                }

                platforms.push({
                    row: r,
                    minCol: minCol,
                    maxCol: maxCol,
                    isGround: !!groundRows[r],
                });
            }
        }

        return platforms;
    }

    /**
     * Generate enemy definitions from tile data.
     * @param {Object} levelData — { tiles, spawn, ... }
     * @returns {Array} — enemy defs [{ type, col, row }, ...]
     */
    function generateEnemies(levelData) {
        var tiles = levelData.tiles;
        var spawnCol = levelData.spawn.x;
        var enemies = [];
        var seed = 1;

        // Exclude boss arena from enemy spawning
        var maxCol = LEVEL.PLAY_SCREENS * 30 - 1;

        var platforms = findPlatforms(tiles);

        // Separate ground segments from elevated platforms
        var elevated = [];
        var groundSegments = [];
        for (var i = 0; i < platforms.length; i++) {
            if (platforms[i].isGround) {
                groundSegments.push(platforms[i]);
            } else {
                elevated.push(platforms[i]);
            }
        }

        // --- 1) Platform enemies (walkers/chargers on elevated platforms) ---
        for (var i = 0; i < elevated.length; i++) {
            var plat = elevated[i];
            var platWidth = plat.maxCol - plat.minCol + 1;

            // Skip very small platforms (< 3 tiles)
            if (platWidth < 3) continue;

            var roll = seededRand(seed++);
            if (roll >= SPAWN.PLATFORM_ENEMY_CHANCE) continue;

            // Place enemy near middle of platform
            var enemyCol = plat.minCol + Math.floor(platWidth / 2);
            var enemyRow = plat.row - 1; // stand on top

            // Skip if too close to spawn or inside boss arena
            if (Math.abs(enemyCol - spawnCol) < SPAWN.SPAWN_SAFE_COLS) continue;
            if (enemyCol > maxCol) continue;

            var type = seededRand(seed++) < SPAWN.PLATFORM_CHARGER_RATIO ? 'charger' : 'walker';
            enemies.push({ type: type, col: enemyCol, row: enemyRow });
        }

        // --- 2) Ground chargers (spread across ground segments) ---
        var groundCols = [];
        for (var i = 0; i < groundSegments.length; i++) {
            var seg = groundSegments[i];
            // Only use the topmost ground row for spawning
            if (i > 0 && groundSegments[i - 1].row < seg.row &&
                groundSegments[i - 1].minCol === seg.minCol) continue;

            for (var c = seg.minCol; c <= seg.maxCol; c++) {
                if (c > maxCol) break;
                // Only add if this is the top surface of ground
                if (!isSolid(tiles, c, seg.row - 1)) {
                    groundCols.push({ col: c, row: seg.row - 1 });
                }
            }
        }

        // Shuffle ground positions deterministically
        for (var i = groundCols.length - 1; i > 0; i--) {
            var j = Math.floor(seededRand(seed++) * (i + 1));
            var tmp = groundCols[i];
            groundCols[i] = groundCols[j];
            groundCols[j] = tmp;
        }

        var chargersPlaced = 0;
        for (var i = 0; i < groundCols.length && chargersPlaced < SPAWN.GROUND_CHARGERS; i++) {
            var pos = groundCols[i];
            if (Math.abs(pos.col - spawnCol) < SPAWN.SPAWN_SAFE_COLS) continue;

            // Check not too close to an existing enemy
            var tooClose = false;
            for (var e = 0; e < enemies.length; e++) {
                if (Math.abs(enemies[e].col - pos.col) < 4 && enemies[e].row === pos.row) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            enemies.push({ type: 'charger', col: pos.col, row: pos.row });
            chargersPlaced++;
        }

        // --- 3) Also add some walkers on ground (same count as chargers) ---
        var walkersPlaced = 0;
        for (var i = 0; i < groundCols.length && walkersPlaced < SPAWN.GROUND_CHARGERS; i++) {
            var pos = groundCols[i];
            if (Math.abs(pos.col - spawnCol) < SPAWN.SPAWN_SAFE_COLS) continue;

            var tooClose = false;
            for (var e = 0; e < enemies.length; e++) {
                if (Math.abs(enemies[e].col - pos.col) < 4 && Math.abs(enemies[e].row - pos.row) <= 1) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            enemies.push({ type: 'walker', col: pos.col, row: pos.row });
            walkersPlaced++;
        }

        // --- 4) Flyers (scattered in the airspace) ---
        var flyersPlaced = 0;
        var W = tiles[0].length;
        var attempts = 0;
        while (flyersPlaced < SPAWN.FLYERS && attempts < 500) {
            attempts++;
            var col = Math.floor(seededRand(seed++) * W);
            var row = SPAWN.FLYER_MIN_ROW + Math.floor(seededRand(seed++) * (SPAWN.FLYER_MAX_ROW - SPAWN.FLYER_MIN_ROW));

            if (Math.abs(col - spawnCol) < SPAWN.SPAWN_SAFE_COLS) continue;
            if (col > maxCol) continue;
            if (isSolid(tiles, col, row)) continue;

            // Not too close to another flyer
            var tooClose = false;
            for (var e = 0; e < enemies.length; e++) {
                if (enemies[e].type === 'flyer' && Math.abs(enemies[e].col - col) < 6) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            enemies.push({ type: 'flyer', col: col, row: row });
            flyersPlaced++;
        }

        return enemies;
    }

    SpaceBoy.generateEnemies = generateEnemies;
})();
