// =============================================================================
// Space Boy! — Level 2 Map Data
// 270 columns × 16 rows  (8 play screens + 1 boss arena screen)
//
// Legend:
//   0 = empty
//   1 = ground (solid)
//   2 = platform (solid, jumpable)
//   3 = lava (instant death)
//   4 = spawn point (treated as empty)
//
// Design rules (enforced by validator):
//   - Max jump height: 2 tiles  |  Max jump distance: 3 tiles
//   - Every platform must be reachable via ≤2-tile height steps
//   - Lava gaps ≤ 3 tiles wide (or bridged by platforms)
//   - Gems must not be inside solid tiles
// =============================================================================

(function () {
    function buildTiles() {
        var W = 270;                    // 8 play screens + 1 boss arena
        var H = 16;
        var G = 1;   // GROUND
        var P = 2;   // PLATFORM
        var L = 3;   // LAVA
        var _ = 0;   // EMPTY

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
        // GROUND FLOOR — row 14-15, broken up by lava pits (≤3 tiles wide)
        // =====================================================================
        fillRect(14, 15, 0, 27, G);
        fillRow(15, 28, 30, L); fillRow(14, 28, 30, _);
        fillRect(14, 15, 31, 55, G);
        fillRow(15, 56, 58, L); fillRow(14, 56, 58, _);
        fillRect(14, 15, 59, 84, G);
        fillRow(15, 85, 87, L); fillRow(14, 85, 87, _);
        fillRect(14, 15, 88, 114, G);
        fillRow(15, 115, 117, L); fillRow(14, 115, 117, _);
        fillRect(14, 15, 118, 144, G);
        fillRow(15, 145, 147, L); fillRow(14, 145, 147, _);
        fillRect(14, 15, 148, 174, G);
        fillRow(15, 175, 177, L); fillRow(14, 175, 177, _);
        fillRect(14, 15, 178, 204, G);
        fillRow(15, 205, 207, L); fillRow(14, 205, 207, _);
        fillRect(14, 15, 208, W - 1, G);

        // =====================================================================
        // PLATFORMS — Screen 1 (cols 0-29)
        // =====================================================================
        fillRow(12, 6, 10, P);
        fillRow(10, 12, 17, P);     // step-stone within jump range
        fillRow(12, 20, 26, P);     // bridges the lava gap at 28-30

        // =====================================================================
        // PLATFORMS — Screen 2 (cols 30-59)
        // =====================================================================
        fillRow(12, 32, 36, P);
        fillRow(10, 38, 42, P);
        fillRow(8,  44, 48, P);
        fillRow(10, 50, 54, P);

        // =====================================================================
        // PLATFORMS — Screen 3 (cols 60-89) — ascending staircase
        // =====================================================================
        fillRow(12, 62, 65, P);
        fillRow(10, 67, 70, P);
        fillRow(8,  72, 75, P);
        fillRow(10, 78, 82, P);

        // =====================================================================
        // PLATFORMS — Screen 4 (cols 90-119)
        // =====================================================================
        fillRow(12, 92, 96, P);
        fillRow(10, 98, 102, P);
        fillRow(12, 105, 109, P);
        fillRow(10, 111, 114, P);

        // =====================================================================
        // PLATFORMS — Screen 5 (cols 120-149) — vertical climb
        // =====================================================================
        fillRow(12, 122, 125, P);
        fillRow(10, 127, 130, P);
        fillRow(8,  132, 135, P);
        fillRow(6,  137, 140, P);
        fillRow(8,  142, 144, P);

        // =====================================================================
        // PLATFORMS — Screen 6 (cols 150-179)
        // =====================================================================
        fillRow(12, 152, 156, P);
        fillRow(10, 158, 162, P);
        fillRow(8,  164, 168, P);
        fillRow(10, 170, 173, P);

        // =====================================================================
        // PLATFORMS — Screen 7 (cols 180-209)
        // =====================================================================
        fillRow(12, 182, 186, P);
        fillRow(10, 188, 192, P);
        fillRow(12, 195, 199, P);
        fillRow(10, 201, 204, P);

        // =====================================================================
        // PLATFORMS — Screen 8 (cols 210-239)
        // =====================================================================
        fillRow(12, 212, 216, P);
        fillRow(10, 218, 222, P);
        fillRow(8,  225, 229, P);
        fillRow(10, 231, 235, P);

        // =====================================================================
        // WALLS / PILLARS for variety
        // =====================================================================
        fillRect(12, 13, 50, 50, G);
        fillRect(10, 13, 100, 100, G);
        fillRect(12, 13, 160, 160, G);
        fillRect(10, 13, 200, 200, G);

        // Spawn marker (treated as empty)
        map[13][3] = 4;

        return map;
    }

    SpaceBoy.level2Data = {
        spawn: { x: 3, y: 13 },

        enemies: [], // generated dynamically by spawner.js

        // 24 gems — enough for 2 mega bullets with a few to spare
        gems: [
            // Screen 1 (3)
            { col: 8,  row: 11 },
            { col: 14, row: 9 },
            { col: 24, row: 11 },

            // Screen 2 (3)
            { col: 34, row: 11 },
            { col: 46, row: 7 },
            { col: 52, row: 9 },

            // Screen 3 (3)
            { col: 64, row: 11 },
            { col: 73, row: 7 },
            { col: 80, row: 9 },

            // Screen 4 (3)
            { col: 94, row: 11 },
            { col: 100, row: 9 },
            { col: 112, row: 9 },

            // Screen 5 — the climb (3)
            { col: 128, row: 9 },
            { col: 138, row: 5 },
            { col: 143, row: 7 },

            // Screen 6 (3)
            { col: 154, row: 11 },
            { col: 160, row: 9 },
            { col: 166, row: 7 },

            // Screen 7 (3)
            { col: 184, row: 11 },
            { col: 197, row: 11 },
            { col: 202, row: 9 },

            // Screen 8 (3)
            { col: 220, row: 9 },
            { col: 227, row: 7 },
            { col: 234, row: 9 },
        ],

        tiles: buildTiles(),
    };
})();
