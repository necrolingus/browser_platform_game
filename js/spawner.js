// =============================================================================
// Space Boy! — Enemy Spawner
// Generates enemy placements from tile data + per-level spawn config.
// Each level passes its own SpaceBoy.LEVELS[n].SPAWN to generateEnemies().
// =============================================================================

(function () {
    var TILES = SpaceBoy.TILES;
    var TILE  = SpaceBoy.TILE;
    var LEVEL = SpaceBoy.LEVEL;

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

    // Froggers hop ~2-3 tiles high, so a low ceiling makes them get stuck
    // bonking their head and never going anywhere. Refuse to spawn one if
    // there's any solid tile within HEAD_CLEARANCE rows directly above the
    // standing position (frogger occupies row, head is at row-1).
    var FROGGER_HEAD_CLEARANCE = 4;
    function froggerHasHeadroom(tiles, col, row) {
        for (var r = row - 1; r >= row - FROGGER_HEAD_CLEARANCE && r >= 0; r--) {
            if (isSolid(tiles, col, r)) return false;
        }
        return true;
    }

    /**
     * Scan the tile map and find distinct platform segments.
     * A "platform" = contiguous horizontal run of solid tiles with air above.
     */
    function findPlatforms(tiles) {
        var H = tiles.length;
        var W = tiles[0].length;
        var platforms = [];
        var visited = {};

        var groundRows = {};
        groundRows[H - 2] = true;
        groundRows[H - 1] = true;

        for (var r = 0; r < H; r++) {
            for (var c = 0; c < W; c++) {
                var key = r + ',' + c;
                if (visited[key]) continue;
                if (!isSolid(tiles, c, r)) continue;
                if (isSolid(tiles, c, r - 1)) continue;

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
     * Pick a platform enemy type from the level's PLATFORM_TYPES list,
     * biased by PLATFORM_CHARGER_RATIO / PLATFORM_FROGGER_RATIO.
     */
    function pickPlatformType(cfg, roll) {
        var chargerRatio = cfg.PLATFORM_CHARGER_RATIO || 0;
        var froggerRatio = cfg.PLATFORM_FROGGER_RATIO || 0;
        if (cfg.PLATFORM_TYPES && cfg.PLATFORM_TYPES.indexOf('frogger') >= 0 && roll < froggerRatio) {
            return 'frogger';
        }
        if (cfg.PLATFORM_TYPES && cfg.PLATFORM_TYPES.indexOf('charger') >= 0 && roll < froggerRatio + chargerRatio) {
            return 'charger';
        }
        return 'walker';
    }

    /**
     * Generate enemy definitions from tile data + a SPAWN config object.
     * @param {Object} levelData — { tiles, spawn, ... }
     * @param {Object} spawnCfg — SpaceBoy.LEVELS[n].SPAWN
     * @returns {Array} enemy defs [{ type, col, row }, ...]
     */
    function generateEnemies(levelData, spawnCfg) {
        var tiles = levelData.tiles;
        var spawnCol = levelData.spawn.x;
        var enemies = [];
        var seed = 1;

        var safeCols = spawnCfg.SAFE_COLS || 6;
        var maxCol = LEVEL.PLAY_SCREENS * 30 - 1;

        var platforms = findPlatforms(tiles);

        var elevated = [];
        var groundSegments = [];
        for (var i = 0; i < platforms.length; i++) {
            if (platforms[i].isGround) groundSegments.push(platforms[i]);
            else elevated.push(platforms[i]);
        }

        // --- 1) Platform enemies ---
        for (var i = 0; i < elevated.length; i++) {
            var plat = elevated[i];
            var platWidth = plat.maxCol - plat.minCol + 1;
            if (platWidth < 3) continue;

            var roll = seededRand(seed++);
            if (roll >= spawnCfg.PLATFORM_ENEMY_CHANCE) continue;

            var enemyCol = plat.minCol + Math.floor(platWidth / 2);
            var enemyRow = plat.row - 1;

            if (Math.abs(enemyCol - spawnCol) < safeCols) continue;
            if (enemyCol > maxCol) continue;

            var type = pickPlatformType(spawnCfg, seededRand(seed++));
            // Froggers need vertical headroom to hop — skip cramped spots.
            if (type === 'frogger' && !froggerHasHeadroom(tiles, enemyCol, enemyRow)) {
                continue;
            }
            enemies.push({ type: type, col: enemyCol, row: enemyRow });
        }

        // --- 2) Collect ground positions ---
        var groundCols = [];
        for (var i = 0; i < groundSegments.length; i++) {
            var seg = groundSegments[i];
            if (i > 0 && groundSegments[i - 1].row < seg.row &&
                groundSegments[i - 1].minCol === seg.minCol) continue;

            for (var c = seg.minCol; c <= seg.maxCol; c++) {
                if (c > maxCol) break;
                if (!isSolid(tiles, c, seg.row - 1)) {
                    groundCols.push({ col: c, row: seg.row - 1 });
                }
            }
        }

        // Shuffle deterministically
        for (var i = groundCols.length - 1; i > 0; i--) {
            var j = Math.floor(seededRand(seed++) * (i + 1));
            var tmp = groundCols[i];
            groundCols[i] = groundCols[j];
            groundCols[j] = tmp;
        }

        // --- 3) Place ground enemies per GROUND config ---
        // Iterate ground-list entries: each {type, count}
        var groundIdx = 0;
        var groundList = spawnCfg.GROUND || [];
        for (var gi = 0; gi < groundList.length; gi++) {
            var entry = groundList[gi];
            var placed = 0;
            while (placed < entry.count && groundIdx < groundCols.length) {
                var pos = groundCols[groundIdx++];
                if (Math.abs(pos.col - spawnCol) < safeCols) continue;

                // Froggers need vertical headroom to hop — skip cramped spots.
                if (entry.type === 'frogger' && !froggerHasHeadroom(tiles, pos.col, pos.row)) {
                    continue;
                }

                var tooClose = false;
                for (var e = 0; e < enemies.length; e++) {
                    if (Math.abs(enemies[e].col - pos.col) < 4 && Math.abs(enemies[e].row - pos.row) <= 1) {
                        tooClose = true;
                        break;
                    }
                }
                if (tooClose) continue;

                enemies.push({ type: entry.type, col: pos.col, row: pos.row });
                placed++;
            }
        }

        // --- 4) Air enemies (flyers, dashers) ---
        var W = tiles[0].length;
        var airList = spawnCfg.AIR || [];
        for (var ai = 0; ai < airList.length; ai++) {
            var entry = airList[ai];
            var placed = 0;
            var attempts = 0;
            while (placed < entry.count && attempts < 500) {
                attempts++;
                var col = Math.floor(seededRand(seed++) * W);
                var rowRange = entry.maxRow - entry.minRow;
                var row = entry.minRow + Math.floor(seededRand(seed++) * rowRange);

                if (Math.abs(col - spawnCol) < safeCols) continue;
                if (col > maxCol) continue;
                if (isSolid(tiles, col, row)) continue;

                var tooClose = false;
                for (var e = 0; e < enemies.length; e++) {
                    if (enemies[e].type === entry.type && Math.abs(enemies[e].col - col) < 6 && Math.abs(enemies[e].row - row) < 3) {
                        tooClose = true;
                        break;
                    }
                }
                if (tooClose) continue;

                enemies.push({ type: entry.type, col: col, row: row });
                placed++;
            }
        }

        return enemies;
    }

    SpaceBoy.generateEnemies = generateEnemies;
})();
