// =============================================================================
// Space Boy! — Level 1 Map Data
// 120 columns × 16 rows  (4 screens of 30 cols each)
//
// Legend:
//   0 = empty
//   1 = ground (solid)
//   2 = platform (solid, jumpable)
//   3 = lava (instant death)
//   4 = spawn point (treated as empty)
//
// Enemy defs: { type, col, row }
// Gem defs:   { col, row }
//
// Design rules (enforced by validator):
//   - Max jump height: 2 tiles  |  Max jump distance: 3 tiles
//   - Every platform must be reachable via ≤2-tile height steps
//   - Lava gaps ≤ 3 tiles wide (or bridged by platforms)
//   - Gems must not be inside solid tiles
//   - Ground enemies must have solid ground below them
// =============================================================================

(function () {
    function buildTiles() {
        var W = 120; // LEVEL.WIDTH_TILES
        var H = 16;  // LEVEL.HEIGHT_TILES
        var G = 1;   // GROUND
        var P = 2;   // PLATFORM
        var L = 3;   // LAVA
        var _ = 0;   // EMPTY

        // Start with all empty
        var map = [];
        for (var i = 0; i < H; i++) {
            map.push(new Array(W).fill(_));
        }

        function fillRow(row, colStart, colEnd, tile) {
            for (var c = colStart; c <= colEnd && c < W; c++) {
                map[row][c] = tile;
            }
        }

        function fillRect(rowStart, rowEnd, colStart, colEnd, tile) {
            for (var r = rowStart; r <= rowEnd; r++) {
                fillRow(r, colStart, colEnd, tile);
            }
        }

        // =====================================================================
        // GROUND FLOOR — row 14-15 (bottom two rows)
        // =====================================================================
        fillRect(14, 15, 0, 25, G);        // Screen 1 ground
        // Lava pit at cols 26-28 (3 tiles — within jump range)
        fillRow(15, 26, 28, L);
        fillRow(14, 26, 28, _);
        fillRect(14, 15, 29, 56, G);       // Screen 2 ground
        // FIX: Narrowed lava pit from 4 tiles to 3 tiles (cols 57-59)
        fillRow(15, 57, 59, L);
        fillRow(14, 57, 59, _);
        fillRect(14, 15, 60, 88, G);       // Screen 3 ground
        // Lava pit at cols 89-91 (3 tiles)
        fillRow(15, 89, 91, L);
        fillRow(14, 89, 91, _);
        fillRect(14, 15, 92, 119, G);      // Screen 4 ground

        // =====================================================================
        // PLATFORMS — Screen 1 (cols 0-29)
        // Max 2-tile height steps from ground (row 14), spaced for clear jumps
        // =====================================================================
        fillRow(12, 6, 10, P);            // step 1: row 12 (2 up from ground 14)
        fillRow(10, 14, 18, P);           // step 2: row 10 (2 up from row 12)
        fillRow(8, 21, 25, P);            // step 3: row 8 (2 up from row 10)

        // =====================================================================
        // PLATFORMS — Screen 2 (cols 30-59)
        // =====================================================================
        fillRow(12, 32, 36, P);           // row 12 (2 up from ground)
        fillRow(10, 37, 41, P);           // FIX: step stone row 10 (2 up from 12) — was row 8
        fillRow(8, 42, 46, P);            // row 8 — reachable from row 10 (2 up)
        fillRow(10, 48, 52, P);           // row 10 — reachable from row 12 or 8
        fillRow(8, 53, 56, P);            // FIX: lowered from row 6 to row 8 — reachable from row 10

        // =====================================================================
        // PLATFORMS — Screen 3 (cols 60-89) — vertical platforming
        // All steps ≤ 2 tiles high
        // =====================================================================
        fillRow(12, 62, 65, P);           // row 12 (2 up from ground)
        fillRow(10, 66, 69, P);           // row 10 (2 up from 12)
        fillRow(8, 70, 73, P);            // row 8 (2 up from 10)
        fillRow(6, 74, 77, P);            // row 6 (2 up from 8)
        fillRow(8, 79, 83, P);            // row 8 (drop from 6, or jump from 10)
        fillRow(10, 84, 88, P);           // row 10 (drop from 8)

        // =====================================================================
        // PLATFORMS — Screen 4 (cols 90-119) — gauntlet
        // =====================================================================
        fillRow(12, 93, 96, P);           // row 12 (2 up from ground)
        fillRow(10, 98, 102, P);          // row 10 (2 up from 12)
        fillRow(8, 104, 107, P);          // row 8 (2 up from 10)
        fillRow(10, 109, 112, P);         // row 10 (drop from 8)
        fillRow(12, 114, 118, P);         // row 12 (drop from 10)

        // =====================================================================
        // WALLS / PILLARS for variety
        // =====================================================================
        fillRect(12, 13, 25, 25, G);      // small pillar screen 1
        fillRect(10, 13, 78, 78, G);      // wall in screen 3

        // Spawn marker (treated as empty by game logic)
        map[13][3] = 4;

        return map;
    }

    SpaceBoy.level1Data = {
        spawn: { x: 3, y: 13 },

        enemies: [], // generated dynamically by spawner.js

        gems: [
            // Screen 1 — gems above platforms
            { col: 8,  row: 11 },          // above row-12 platform
            { col: 16, row: 9 },           // above row-10 platform
            { col: 23, row: 7 },           // above row-8 platform

            // Screen 2
            { col: 34, row: 11 },          // FIX: moved from inside solid (35,12) to above it
            { col: 42, row: 7 },
            { col: 49, row: 9 },
            { col: 55, row: 7 },

            // Screen 3
            { col: 65, row: 5 },
            { col: 72, row: 3 },
            { col: 80, row: 7 },
            { col: 85, row: 9 },

            // Screen 4
            { col: 94, row: 11 },
            { col: 100, row: 9 },
            { col: 106, row: 7 },
            { col: 116, row: 11 },
        ],

        tiles: buildTiles(),
    };
})();
