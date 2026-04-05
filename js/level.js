// =============================================================================
// Space Boy! — Level loader & tile renderer
// Mario-style soil + grass tiles with flower decorations.
// =============================================================================

(function () {
    var TILE = SpaceBoy.TILE;
    var TILES = SpaceBoy.TILES;
    var TILE_COLORS = SpaceBoy.TILE_COLORS;
    var LEVEL = SpaceBoy.LEVEL;
    var TERRAIN = SpaceBoy.TERRAIN;
    var S = TILE.SIZE;

    // Seeded pseudo-random per tile (deterministic so flowers don't flicker)
    function tileRand(col, row, seed) {
        var n = Math.sin(col * 127.1 + row * 311.7 + seed * 57.3) * 43758.5453;
        return n - Math.floor(n);
    }

    class Level {
        constructor(mapData) {
            this.tiles = mapData.tiles;
            this.spawnX = mapData.spawn.x * TILE.SIZE;
            this.spawnY = mapData.spawn.y * TILE.SIZE - SpaceBoy.PLAYER.HEIGHT;
            this.enemyDefs = mapData.enemies;
            this.gemDefs = mapData.gems;

            // Pre-compute flower placement so it's stable
            this._flowers = this._generateFlowers();
        }

        getTile(col, row) {
            if (row < 0 || row >= LEVEL.HEIGHT_TILES || col < 0 || col >= LEVEL.WIDTH_TILES) {
                return TILES.EMPTY;
            }
            return this.tiles[row][col];
        }

        isSolid(col, row) {
            var t = this.getTile(col, row);
            return t === TILES.GROUND || t === TILES.PLATFORM;
        }

        isLava(col, row) {
            return this.getTile(col, row) === TILES.LAVA;
        }

        // Check if the tile above is NOT solid (meaning this tile is a "top" surface)
        _isTopSurface(col, row) {
            return !this.isSolid(col, row - 1);
        }

        _generateFlowers() {
            var flowers = [];
            for (var c = 0; c < LEVEL.WIDTH_TILES; c++) {
                for (var r = 0; r < LEVEL.HEIGHT_TILES; r++) {
                    var tile = this.getTile(c, r);
                    if ((tile === TILES.GROUND || tile === TILES.PLATFORM) && this._isTopSurface(c, r)) {
                        if (tileRand(c, r, 99) < TERRAIN.FLOWER_CHANCE) {
                            var colorIdx = Math.floor(tileRand(c, r, 42) * TERRAIN.FLOWER_COLORS.length);
                            flowers.push({
                                col: c,
                                row: r,
                                offsetX: 4 + tileRand(c, r, 7) * (S - 8),
                                color: TERRAIN.FLOWER_COLORS[colorIdx],
                                stemH: TERRAIN.FLOWER_STEM_HEIGHT * (0.6 + tileRand(c, r, 13) * 0.4),
                            });
                        }
                    }
                }
            }
            return flowers;
        }

        draw(ctx, camera) {
            var startCol = Math.floor(camera.x / S);
            var endCol = Math.ceil((camera.x + ctx.canvas.width) / S);
            var startRow = 0;
            var endRow = LEVEL.HEIGHT_TILES;

            // --- Pass 1: Draw soil bodies ---
            for (var r = startRow; r < endRow; r++) {
                for (var c = startCol; c <= endCol; c++) {
                    var tile = this.getTile(c, r);
                    if (tile === TILES.LAVA) {
                        this._drawLava(ctx, c, r, camera);
                        continue;
                    }
                    if (tile !== TILES.GROUND && tile !== TILES.PLATFORM) continue;

                    var sx = c * S - camera.x;
                    var sy = r * S - camera.y;
                    this._drawSoil(ctx, sx, sy, c, r);
                }
            }

            // --- Pass 2: Grass on top surfaces + draping ---
            for (var r = startRow; r < endRow; r++) {
                for (var c = startCol; c <= endCol; c++) {
                    var tile = this.getTile(c, r);
                    if (tile !== TILES.GROUND && tile !== TILES.PLATFORM) continue;
                    if (!this._isTopSurface(c, r)) continue;

                    var sx = c * S - camera.x;
                    var sy = r * S - camera.y;
                    this._drawGrass(ctx, sx, sy, c, r);
                }
            }

            // --- Pass 3: Flowers (decorative, on top surfaces) ---
            for (var i = 0; i < this._flowers.length; i++) {
                var f = this._flowers[i];
                if (f.col < startCol - 1 || f.col > endCol + 1) continue;
                var fx = f.col * S - camera.x + f.offsetX;
                var fy = f.row * S - camera.y;
                this._drawFlower(ctx, fx, fy, f);
            }
        }

        _drawSoil(ctx, sx, sy, col, row) {
            // Base soil fill
            ctx.fillStyle = TERRAIN.SOIL_COLOR;
            ctx.fillRect(sx, sy, S, S);

            // Darker patches for depth
            var r1 = tileRand(col, row, 1);
            var r2 = tileRand(col, row, 2);
            ctx.fillStyle = TERRAIN.SOIL_COLOR_DARK;
            ctx.fillRect(sx + r1 * 16, sy + r2 * 16, 10 + r1 * 8, 8 + r2 * 6);

            // Speckle dots (small dirt details)
            ctx.fillStyle = TERRAIN.SOIL_SPECKLE;
            for (var i = 0; i < TERRAIN.SOIL_DETAIL_COUNT; i++) {
                var dx = tileRand(col, row, 10 + i) * (S - 4) + 2;
                var dy = tileRand(col, row, 20 + i) * (S - 4) + 2;
                var ds = 1 + tileRand(col, row, 30 + i) * 2;
                ctx.fillRect(sx + dx, sy + dy, ds, ds);
            }

            // Subtle border line on bottom/right for depth
            ctx.fillStyle = TERRAIN.SOIL_COLOR_DARK;
            ctx.fillRect(sx, sy + S - 1, S, 1);
        }

        _drawGrass(ctx, sx, sy, col, row) {
            var gh = TERRAIN.GRASS_TOP_HEIGHT;

            // Green strip on top of tile
            ctx.fillStyle = TERRAIN.GRASS_COLOR;
            ctx.fillRect(sx, sy, S, gh);

            // Darker grass line at very top
            ctx.fillStyle = TERRAIN.GRASS_COLOR_DARK;
            ctx.fillRect(sx, sy, S, 2);

            // Light highlight strip
            ctx.fillStyle = TERRAIN.GRASS_COLOR_LIGHT;
            ctx.fillRect(sx, sy + 2, S, 2);

            // Grass blades sticking up above the tile
            for (var i = 0; i < TERRAIN.GRASS_BLADE_COUNT; i++) {
                var bx = sx + tileRand(col, row, 50 + i) * S;
                var bh = TERRAIN.GRASS_BLADE_HEIGHT * (0.5 + tileRand(col, row, 60 + i) * 0.5);
                var lean = (tileRand(col, row, 70 + i) - 0.5) * 4;
                var bladeColor = tileRand(col, row, 80 + i) > 0.5 ? TERRAIN.GRASS_COLOR : TERRAIN.GRASS_COLOR_LIGHT;

                ctx.strokeStyle = bladeColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(bx, sy);
                ctx.quadraticCurveTo(bx + lean, sy - bh * 0.6, bx + lean * 1.5, sy - bh);
                ctx.stroke();
            }

            // Grass draping on the front face (hanging down)
            for (var i = 0; i < TERRAIN.GRASS_DRAPE_COUNT; i++) {
                var dx = sx + tileRand(col, row, 90 + i) * S;
                var dLen = TERRAIN.GRASS_DRAPE_MAX_LENGTH * (0.4 + tileRand(col, row, 100 + i) * 0.6);
                var dLean = (tileRand(col, row, 110 + i) - 0.5) * 3;
                var drapeColor = tileRand(col, row, 120 + i) > 0.4 ? TERRAIN.GRASS_COLOR : TERRAIN.GRASS_COLOR_DARK;

                ctx.strokeStyle = drapeColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(dx, sy + gh);
                ctx.quadraticCurveTo(dx + dLean, sy + gh + dLen * 0.6, dx + dLean * 1.5, sy + gh + dLen);
                ctx.stroke();
            }
        }

        _drawFlower(ctx, fx, fy, flower) {
            var stemH = flower.stemH;
            var petalR = TERRAIN.FLOWER_SIZE;

            // Stem
            ctx.strokeStyle = TERRAIN.FLOWER_STEM_COLOR;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(fx, fy - stemH);
            ctx.stroke();

            // Petals (4-5 around center)
            var petalCount = 4;
            ctx.fillStyle = flower.color;
            for (var p = 0; p < petalCount; p++) {
                var angle = (p / petalCount) * Math.PI * 2;
                var px = fx + Math.cos(angle) * petalR;
                var py = fy - stemH + Math.sin(angle) * petalR;
                ctx.beginPath();
                ctx.arc(px, py, petalR * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }

            // Center dot
            ctx.fillStyle = TERRAIN.FLOWER_CENTER_COLOR;
            ctx.beginPath();
            ctx.arc(fx, fy - stemH, petalR * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }

        _drawLava(ctx, col, row, camera) {
            var sx = col * S - camera.x;
            var sy = row * S - camera.y;

            ctx.fillStyle = TILE_COLORS[TILES.LAVA];
            ctx.fillRect(sx, sy, S, S);

            var glow = 0.3 + 0.2 * Math.sin(performance.now() / 200 + col);
            ctx.fillStyle = 'rgba(255, 200, 0, ' + glow + ')';
            ctx.fillRect(sx, sy, S, S * 0.4);
        }
    }

    SpaceBoy.Level = Level;
})();
