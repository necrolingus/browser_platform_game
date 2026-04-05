// =============================================================================
// Space Boy! — Level Validator
// Validates and auto-fixes level data against physics-derived constraints.
// Runs automatically on level load. Can also be run manually:
//   SpaceBoy.validateLevel(SpaceBoy.level1Data)
// =============================================================================

(function () {
    var TILE  = SpaceBoy.TILE;
    var TILES = SpaceBoy.TILES;
    var PLAYER = SpaceBoy.PLAYER;
    var PHYSICS = SpaceBoy.PHYSICS;
    var LEVEL = SpaceBoy.LEVEL;

    // -------------------------------------------------------------------------
    // Derived physics limits
    // -------------------------------------------------------------------------
    var jumpSpeed   = Math.abs(PLAYER.JUMP_VELOCITY);
    var gravity     = PHYSICS.GRAVITY;
    var timeToPeak  = jumpSpeed / gravity;
    var totalAirTime = timeToPeak * 2;
    var maxJumpHeightPx = (jumpSpeed * jumpSpeed) / (2 * gravity);
    var airSpeedPx  = PLAYER.SPEED * PLAYER.AIR_CONTROL;
    var leapBoostPx = PLAYER.LEAP_VELOCITY_X * (1 / 60);
    var maxJumpDistPx = airSpeedPx * totalAirTime + leapBoostPx;

    var MAX_JUMP_HEIGHT_TILES = Math.floor(maxJumpHeightPx / TILE.SIZE);
    var MAX_JUMP_DIST_TILES   = Math.floor(maxJumpDistPx / TILE.SIZE);

    SpaceBoy.PHYSICS_LIMITS = {
        MAX_JUMP_HEIGHT_PX: maxJumpHeightPx,
        MAX_JUMP_HEIGHT_TILES: MAX_JUMP_HEIGHT_TILES,
        MAX_JUMP_DIST_PX: maxJumpDistPx,
        MAX_JUMP_DIST_TILES: MAX_JUMP_DIST_TILES,
        AIR_TIME: totalAirTime,
    };

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    function tileAt(tiles, col, row) {
        if (row < 0 || row >= tiles.length || col < 0 || col >= tiles[0].length) {
            return TILES.EMPTY;
        }
        return tiles[row][col];
    }

    function isSolid(tiles, col, row) {
        var t = tileAt(tiles, col, row);
        return t === TILES.GROUND || t === TILES.PLATFORM;
    }

    function isLava(tiles, col, row) {
        return tileAt(tiles, col, row) === TILES.LAVA;
    }

    // -------------------------------------------------------------------------
    // Rule 1: Gems not inside solid tiles — AUTO-FIX by moving gem upward
    // -------------------------------------------------------------------------
    function fixGemsInSolids(data) {
        var fixes = [];
        for (var i = 0; i < data.gems.length; i++) {
            var g = data.gems[i];
            if (isSolid(data.tiles, g.col, g.row)) {
                var origRow = g.row;
                // Move gem upward until it's in open air
                while (g.row > 0 && isSolid(data.tiles, g.col, g.row)) {
                    g.row--;
                }
                // One more row up so it floats above the surface
                if (g.row > 0) g.row--;
                fixes.push('Gem #' + i + ' at (' + g.col + ',' + origRow +
                    ') was inside solid — moved to (' + g.col + ',' + g.row + ')');
            }
        }
        return fixes;
    }

    // -------------------------------------------------------------------------
    // Rule 2: Lava gaps must be crossable — WARN (requires manual redesign)
    // -------------------------------------------------------------------------
    function checkLavaGaps(data) {
        var issues = [];
        var tiles = data.tiles;
        var H = tiles.length;

        for (var r = H - 2; r < H; r++) {
            var lavaStart = -1;
            for (var c = 0; c <= tiles[0].length; c++) {
                var lava = c < tiles[0].length && isLava(tiles, c, r);
                if (lava && lavaStart === -1) {
                    lavaStart = c;
                } else if (!lava && lavaStart !== -1) {
                    var width = c - lavaStart;
                    if (width > MAX_JUMP_DIST_TILES) {
                        var hasBridge = false;
                        for (var pr = 0; pr < r; pr++) {
                            for (var pc = lavaStart; pc < c; pc++) {
                                if (isSolid(tiles, pc, pr)) {
                                    hasBridge = true;
                                    break;
                                }
                            }
                            if (hasBridge) break;
                        }
                        if (!hasBridge) {
                            issues.push('BLOCKED: Lava gap at row ' + r + ', cols ' + lavaStart + '-' + (c - 1) +
                                ' is ' + width + ' tiles wide (max: ' + MAX_JUMP_DIST_TILES +
                                '). Narrow it or add platforms above.');
                        }
                    }
                    lavaStart = -1;
                }
            }
        }
        return issues;
    }

    // -------------------------------------------------------------------------
    // Rule 3: Platform reachability — WARN (requires manual redesign)
    // -------------------------------------------------------------------------
    function checkPlatformReachability(data) {
        var issues = [];
        var tiles = data.tiles;
        var H = tiles.length;
        var W = tiles[0].length;

        var surfaces = [];
        for (var r = 0; r < H; r++) {
            for (var c = 0; c < W; c++) {
                if (isSolid(tiles, c, r) && !isSolid(tiles, c, r - 1)) {
                    surfaces.push({ col: c, row: r });
                }
            }
        }

        var spawnRow = data.spawn.y;
        var spawnCol = data.spawn.x;

        // Group into platforms
        var platforms = [];
        var visited = {};
        for (var i = 0; i < surfaces.length; i++) {
            var s = surfaces[i];
            var key = s.row + ',' + s.col;
            if (visited[key]) continue;

            var minCol = s.col, maxCol = s.col;
            while (minCol > 0 && isSolid(tiles, minCol - 1, s.row) && !isSolid(tiles, minCol - 1, s.row - 1)) {
                minCol--;
            }
            while (maxCol < W - 1 && isSolid(tiles, maxCol + 1, s.row) && !isSolid(tiles, maxCol + 1, s.row - 1)) {
                maxCol++;
            }
            platforms.push({ row: s.row, minCol: minCol, maxCol: maxCol });
            for (var cc = minCol; cc <= maxCol; cc++) {
                visited[s.row + ',' + cc] = true;
            }
        }

        for (var i = 0; i < platforms.length; i++) {
            var p = platforms[i];
            var isSpawnPlatform = (p.row >= spawnRow && p.minCol <= spawnCol && p.maxCol >= spawnCol);
            if (isSpawnPlatform) continue;

            var reachable = false;
            for (var j = 0; j < platforms.length; j++) {
                if (i === j) continue;
                var other = platforms[j];

                var hDist;
                if (p.minCol > other.maxCol) hDist = p.minCol - other.maxCol;
                else if (other.minCol > p.maxCol) hDist = other.minCol - p.maxCol;
                else hDist = 0;

                var vDist = other.row - p.row;

                if (vDist >= 0) {
                    if (vDist <= MAX_JUMP_HEIGHT_TILES && hDist <= MAX_JUMP_DIST_TILES) {
                        reachable = true;
                        break;
                    }
                } else {
                    if (hDist <= MAX_JUMP_DIST_TILES) {
                        reachable = true;
                        break;
                    }
                }
            }

            if (!reachable) {
                issues.push('BLOCKED: Platform at row ' + p.row + ', cols ' + p.minCol + '-' + p.maxCol +
                    ' is unreachable. Add stepping-stone platforms (max height step: ' +
                    MAX_JUMP_HEIGHT_TILES + ' tiles, max distance: ' + MAX_JUMP_DIST_TILES + ' tiles).');
            }
        }
        return issues;
    }

    // -------------------------------------------------------------------------
    // Rule 4: Ground enemies on valid surfaces — AUTO-FIX by finding ground below
    // -------------------------------------------------------------------------
    function fixEnemyPlacements(data) {
        var fixes = [];
        var tiles = data.tiles;
        for (var i = 0; i < data.enemies.length; i++) {
            var e = data.enemies[i];
            if (e.type === 'flyer') continue;
            var below = e.row + 1;
            if (!isSolid(tiles, e.col, below)) {
                var origRow = e.row;
                // Search downward for solid ground
                var newRow = e.row;
                while (newRow < tiles.length - 1 && !isSolid(tiles, e.col, newRow + 1)) {
                    newRow++;
                }
                if (newRow < tiles.length - 1 && isSolid(tiles, e.col, newRow + 1)) {
                    e.row = newRow;
                    fixes.push('Enemy #' + i + ' (' + e.type + ') at (' + e.col + ',' + origRow +
                        ') was floating — moved to (' + e.col + ',' + e.row + ')');
                } else {
                    fixes.push('WARNING: Enemy #' + i + ' (' + e.type + ') at (' + e.col + ',' + origRow +
                        ') has no ground below — could not auto-fix, remove manually');
                }
            }
        }
        return fixes;
    }

    // -------------------------------------------------------------------------
    // Main validator — auto-fixes what it can, warns about the rest
    // -------------------------------------------------------------------------
    function validateLevel(data) {
        var hasIssues = false;

        // --- Auto-fixable rules ---
        var gemFixes = fixGemsInSolids(data);
        if (gemFixes.length > 0) {
            hasIssues = true;
            console.warn('[VALIDATOR AUTO-FIX] Gems in solids (' + gemFixes.length + ' fixed):');
            for (var i = 0; i < gemFixes.length; i++) console.warn('  ' + gemFixes[i]);
        }

        var enemyFixes = fixEnemyPlacements(data);
        if (enemyFixes.length > 0) {
            hasIssues = true;
            console.warn('[VALIDATOR AUTO-FIX] Enemy placements (' + enemyFixes.length + ' fixed):');
            for (var i = 0; i < enemyFixes.length; i++) console.warn('  ' + enemyFixes[i]);
        }

        // --- Warning-only rules (need manual level design changes) ---
        var lavaIssues = checkLavaGaps(data);
        if (lavaIssues.length > 0) {
            hasIssues = true;
            console.error('[VALIDATOR ERROR] Lava gaps (' + lavaIssues.length + ' issues):');
            for (var i = 0; i < lavaIssues.length; i++) console.error('  ' + lavaIssues[i]);
        }

        var reachIssues = checkPlatformReachability(data);
        if (reachIssues.length > 0) {
            hasIssues = true;
            console.error('[VALIDATOR ERROR] Platform reachability (' + reachIssues.length + ' issues):');
            for (var i = 0; i < reachIssues.length; i++) console.error('  ' + reachIssues[i]);
        }

        if (!hasIssues) {
            console.log('[VALIDATOR] Level OK — all checks passed (jump height: ' +
                MAX_JUMP_HEIGHT_TILES + ' tiles, jump dist: ' + MAX_JUMP_DIST_TILES + ' tiles)');
        }

        return lavaIssues.concat(reachIssues);
    }

    SpaceBoy.validateLevel = validateLevel;
})();
