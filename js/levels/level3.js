// =============================================================================
// Space Boy! — Level 3 Map Data
// 270 columns x 16 rows  (8 play screens + 1 boss arena)
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
//   - Every platform must be reachable via <= 2-tile height steps
//   - Lava gaps <= 3 tiles wide (or bridged by platforms)
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
        // GROUND FLOOR — row 14-15, broken by lava pits
        // =====================================================================
        fillRect(14, 15, 0, 22, G);
        fillRow(15, 23, 25, L); fillRow(14, 23, 25, _);
        fillRect(14, 15, 26, 55, G);
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
        // PLATFORMS — Screen 1 (cols 0-29) — dense ledges for combat
        // =====================================================================
        fillRow(12, 4, 7, P);
        fillRow(10, 9, 12, P);
        fillRow(12, 14, 17, P);
        fillRow(8,  14, 17, P);
        fillRow(10, 20, 23, P);
        fillRow(12, 24, 27, P);
        fillRow(6,  9, 12, P);
        fillRow(8,  21, 24, P);

        // =====================================================================
        // PLATFORMS — Screen 2 (cols 30-59)
        // =====================================================================
        fillRow(12, 30, 33, P);
        fillRow(10, 35, 38, P);
        fillRow(8,  40, 43, P);
        fillRow(12, 44, 47, P);
        fillRow(10, 49, 52, P);
        fillRow(8,  54, 57, P);
        fillRow(6,  36, 39, P);
        fillRow(12, 53, 55, P);

        // =====================================================================
        // PLATFORMS — Screen 3 (cols 60-89) — ascending gauntlet
        // =====================================================================
        fillRow(12, 62, 65, P);
        fillRow(10, 67, 70, P);
        fillRow(8,  72, 75, P);
        fillRow(6,  68, 71, P);
        fillRow(10, 78, 82, P);
        fillRow(12, 84, 87, P);
        fillRow(8,  79, 82, P);

        // =====================================================================
        // PLATFORMS — Screen 4 (cols 90-119) — staggered chaos
        // =====================================================================
        fillRow(12, 92, 95, P);
        fillRow(10, 97, 100, P);
        fillRow(8,  102, 105, P);
        fillRow(12, 106, 109, P);
        fillRow(10, 111, 114, P);
        fillRow(6,  98, 101, P);
        fillRow(8,  112, 115, P);

        // =====================================================================
        // PLATFORMS — Screen 5 (cols 120-149) — vertical climb
        // =====================================================================
        fillRow(12, 122, 125, P);
        fillRow(10, 127, 130, P);
        fillRow(8,  132, 135, P);
        fillRow(6,  128, 131, P);
        fillRow(12, 137, 140, P);
        fillRow(10, 142, 145, P);
        fillRow(8,  138, 141, P);

        // =====================================================================
        // PLATFORMS — Screen 6 (cols 150-179)
        // =====================================================================
        fillRow(12, 152, 155, P);
        fillRow(10, 157, 160, P);
        fillRow(8,  162, 165, P);
        fillRow(6,  158, 161, P);
        fillRow(12, 167, 170, P);
        fillRow(10, 172, 175, P);
        fillRow(8,  168, 171, P);

        // =====================================================================
        // PLATFORMS — Screen 7 (cols 180-209) — dense web
        // =====================================================================
        fillRow(12, 182, 185, P);
        fillRow(10, 187, 190, P);
        fillRow(8,  192, 195, P);
        fillRow(6,  188, 191, P);
        fillRow(12, 197, 200, P);
        fillRow(10, 202, 205, P);
        fillRow(8,  198, 201, P);

        // =====================================================================
        // PLATFORMS — Screen 8 (cols 210-239) — final push
        // =====================================================================
        fillRow(12, 212, 215, P);
        fillRow(10, 217, 220, P);
        fillRow(8,  222, 225, P);
        fillRow(6,  218, 221, P);
        fillRow(12, 227, 230, P);
        fillRow(10, 232, 235, P);
        fillRow(8,  228, 231, P);

        // =====================================================================
        // WALLS / PILLARS for variety
        // =====================================================================
        fillRect(12, 13, 18, 18, G);
        fillRect(10, 13, 48, 48, G);
        fillRect(12, 13, 76, 76, G);
        fillRect(10, 13, 110, 110, G);
        fillRect(12, 13, 136, 136, G);
        fillRect(10, 13, 166, 166, G);
        fillRect(12, 13, 196, 196, G);
        fillRect(10, 13, 226, 226, G);

        // Spawn marker
        map[13][3] = 4;

        return map;
    }

    SpaceBoy.level3Data = {
        spawn: { x: 3, y: 13 },

        enemies: [], // generated dynamically by spawner.js

        // 32 gems — plenty for mega bullets
        gems: [
            // Screen 1 (4)
            { col: 5,  row: 11 },
            { col: 11, row: 5 },
            { col: 16, row: 7 },
            { col: 22, row: 7 },

            // Screen 2 (4)
            { col: 32, row: 11 },
            { col: 37, row: 5 },
            { col: 42, row: 7 },
            { col: 50, row: 9 },

            // Screen 3 (4)
            { col: 64, row: 11 },
            { col: 69, row: 5 },
            { col: 73, row: 7 },
            { col: 80, row: 9 },

            // Screen 4 (4)
            { col: 94, row: 11 },
            { col: 99, row: 5 },
            { col: 104, row: 7 },
            { col: 112, row: 9 },

            // Screen 5 (4)
            { col: 124, row: 11 },
            { col: 129, row: 5 },
            { col: 134, row: 7 },
            { col: 143, row: 9 },

            // Screen 6 (4)
            { col: 154, row: 11 },
            { col: 159, row: 5 },
            { col: 164, row: 7 },
            { col: 173, row: 9 },

            // Screen 7 (4)
            { col: 184, row: 11 },
            { col: 189, row: 5 },
            { col: 194, row: 7 },
            { col: 203, row: 9 },

            // Screen 8 (4)
            { col: 214, row: 11 },
            { col: 219, row: 5 },
            { col: 224, row: 7 },
            { col: 234, row: 9 },
        ],

        tiles: buildTiles(),
    };
})();
