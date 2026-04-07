// =============================================================================
// Space Boy! — Acid Plant (indestructible obstacle)
// Sits on ground. Shoots acid upward every few seconds. Instant death.
// =============================================================================

(function () {
    var AP = SpaceBoy.ACID_PLANT;
    var TILE = SpaceBoy.TILE;
    var LEVEL = SpaceBoy.LEVEL;
    var TILES = SpaceBoy.TILES;

    // Seeded random for deterministic placement
    function srand(seed) {
        var n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return n - Math.floor(n);
    }

    class AcidPlant {
        constructor(x, y) {
            this.x = x;
            this.y = y - AP.HEIGHT;     // place plant on top of ground
            this.width = AP.WIDTH;
            this.height = AP.HEIGHT;
            this.timer = 0;
            this.shooting = false;
            this.acidProgress = 0;      // 0-1 how far acid has risen

            // Acid droplets for visual effect
            this.drops = [];
        }

        update(dt) {
            this.timer += dt;
            var cycle = this.timer % (AP.SHOOT_INTERVAL + AP.SHOOT_DURATION);
            this.shooting = cycle >= AP.SHOOT_INTERVAL;

            if (this.shooting) {
                this.acidProgress = (cycle - AP.SHOOT_INTERVAL) / AP.SHOOT_DURATION;
            } else {
                this.acidProgress = 0;
            }

            // Update acid drops
            for (var i = this.drops.length - 1; i >= 0; i--) {
                var d = this.drops[i];
                d.y += d.vy * dt;
                d.life -= dt;
                if (d.life <= 0) this.drops.splice(i, 1);
            }

            // Spawn acid drops when shooting
            if (this.shooting && Math.random() < 0.4) {
                var cx = this.x + this.width / 2;
                this.drops.push({
                    x: cx + (Math.random() - 0.5) * AP.ACID_WIDTH * 2,
                    y: this.y - AP.ACID_HEIGHT * this.acidProgress + Math.random() * 10,
                    vy: 40 + Math.random() * 30,
                    life: 0.3 + Math.random() * 0.3,
                });
            }
        }

        /** Check if acid stream hits the player */
        hitsPlayer(player) {
            if (!this.shooting || !player.alive) return false;

            var acidX = this.x + this.width / 2 - AP.ACID_WIDTH / 2;
            var acidTop = this.y - AP.ACID_HEIGHT * this.acidProgress;
            var acidBottom = this.y;
            var acidRect = {
                x: acidX,
                y: acidTop,
                width: AP.ACID_WIDTH,
                height: acidBottom - acidTop,
            };

            return (
                player.x < acidRect.x + acidRect.width &&
                player.x + player.width > acidRect.x &&
                player.y < acidRect.y + acidRect.height &&
                player.y + player.height > acidRect.y
            );
        }

        draw(ctx, camera) {
            var sx = this.x - camera.x;
            var sy = this.y - camera.y;
            var cx = sx + this.width / 2;

            // --- Plant body ---
            ctx.save();

            // Neon glow behind plant
            var glowGrad = ctx.createRadialGradient(cx, sy + this.height * 0.4, 5, cx, sy + this.height * 0.4, this.width);
            glowGrad.addColorStop(0, 'rgba(255,0,255,0.25)');
            glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(cx, sy + this.height * 0.4, this.width, 0, Math.PI * 2);
            ctx.fill();

            // Stem (thick, scaled)
            var stemW = this.width * 0.15;
            ctx.fillStyle = AP.COLOR_STEM;
            ctx.fillRect(cx - stemW / 2, sy + this.height * 0.4, stemW, this.height * 0.6);

            // Main body (bulbous blob)
            var bodyRx = this.width / 2;
            var bodyRy = this.height * 0.45;
            var bodyCy = sy + bodyRy;

            // Body gradient
            var bodyGrad = ctx.createRadialGradient(cx - bodyRx * 0.3, bodyCy - bodyRy * 0.3, bodyRx * 0.1, cx, bodyCy, Math.max(bodyRx, bodyRy));
            bodyGrad.addColorStop(0, AP.COLOR_BODY_LIGHT);
            bodyGrad.addColorStop(0.5, AP.COLOR_BODY);
            bodyGrad.addColorStop(1, AP.COLOR_BODY_DARK);
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.ellipse(cx, bodyCy, bodyRx, bodyRy, 0, 0, Math.PI * 2);
            ctx.fill();

            // Neon outline
            ctx.strokeStyle = AP.COLOR_OUTLINE;
            ctx.lineWidth = 2;
            ctx.shadowColor = AP.COLOR_OUTLINE;
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Spots (scaled)
            ctx.fillStyle = AP.COLOR_SPOTS;
            ctx.beginPath();
            ctx.arc(cx - bodyRx * 0.4, bodyCy - bodyRy * 0.2, bodyRx * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + bodyRx * 0.3, bodyCy + bodyRy * 0.1, bodyRx * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx - bodyRx * 0.1, bodyCy + bodyRy * 0.3, bodyRx * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // Mouth opening at top (scaled)
            ctx.fillStyle = AP.COLOR_MOUTH;
            ctx.beginPath();
            ctx.ellipse(cx, sy + bodyRy * 0.15, bodyRx * 0.45, bodyRy * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Lip edges (two leaf-like flaps, scaled)
            var flapH = bodyRy * 0.25;
            ctx.fillStyle = AP.COLOR_BODY;
            ctx.beginPath();
            ctx.ellipse(cx - bodyRx * 0.35, sy + bodyRy * 0.05, bodyRx * 0.35, flapH, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = AP.COLOR_OUTLINE;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx + bodyRx * 0.35, sy + bodyRy * 0.05, bodyRx * 0.35, flapH, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // --- Acid stream ---
            if (this.shooting) {
                var acidTop = sy - AP.ACID_HEIGHT * this.acidProgress;
                var acidH = sy - acidTop;

                // Glow
                ctx.fillStyle = AP.COLOR_ACID_GLOW;
                ctx.fillRect(cx - AP.ACID_WIDTH, acidTop, AP.ACID_WIDTH * 2, acidH);

                // Core stream
                ctx.fillStyle = AP.COLOR_ACID;
                ctx.globalAlpha = 0.7 + Math.sin(performance.now() / 50) * 0.3;
                ctx.fillRect(cx - AP.ACID_WIDTH / 2, acidTop, AP.ACID_WIDTH, acidH);
                ctx.globalAlpha = 1;

                // Splash at top
                ctx.fillStyle = AP.COLOR_ACID;
                for (var i = 0; i < 3; i++) {
                    var splashX = cx + (Math.sin(performance.now() / 100 + i * 2) * AP.ACID_WIDTH);
                    var splashY = acidTop + Math.random() * 5;
                    ctx.beginPath();
                    ctx.arc(splashX, splashY, 2 + Math.random() * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // --- Acid drops (falling after burst) ---
            ctx.fillStyle = AP.COLOR_ACID;
            for (var i = 0; i < this.drops.length; i++) {
                var d = this.drops[i];
                var dx = d.x - camera.x;
                var dy = d.y - camera.y;
                ctx.globalAlpha = d.life * 2;
                ctx.beginPath();
                ctx.arc(dx, dy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            ctx.restore();
        }
    }

    /**
     * Generate acid plant positions for a level.
     * Places plants on ground tiles, spaced apart, away from spawn.
     */
    function generatePlants(levelData, plantCount) {
        var tiles = levelData.tiles;
        var spawnCol = levelData.spawn.x;
        var H = tiles.length;
        var W = tiles[0].length;
        var maxCol = LEVEL.PLAY_SCREENS * 30 - 1; // keep out of boss arena
        var targetCount = (plantCount != null) ? plantCount : AP.COUNT_PER_LEVEL;

        // Find ground-top columns (topmost ground row with air above)
        var groundCols = [];
        for (var c = 0; c <= maxCol; c++) {
            for (var r = 0; r < H; r++) {
                var t = tiles[r][c];
                if ((t === TILES.GROUND || t === TILES.PLATFORM) && (r === 0 || tiles[r - 1][c] === TILES.EMPTY || tiles[r - 1][c] === TILES.SPAWN)) {
                    // Check it's not near lava
                    var nearLava = false;
                    for (var lc = c - 2; lc <= c + 2; lc++) {
                        if (lc >= 0 && lc < W && r + 1 < H && tiles[r + 1] && (tiles[r][lc] === TILES.LAVA || (r + 1 < H && tiles[r + 1][lc] === TILES.LAVA))) {
                            nearLava = true;
                            break;
                        }
                    }
                    if (!nearLava && Math.abs(c - spawnCol) >= AP.SAFE_COLS_FROM_SPAWN) {
                        groundCols.push({ col: c, row: r });
                    }
                    break; // only need topmost
                }
            }
        }

        // Pick positions with minimum spacing
        var plants = [];
        var seed = 777;
        var attempts = 0;

        // Shuffle deterministically
        for (var i = groundCols.length - 1; i > 0; i--) {
            var j = Math.floor(srand(seed++) * (i + 1));
            var tmp = groundCols[i];
            groundCols[i] = groundCols[j];
            groundCols[j] = tmp;
        }

        for (var i = 0; i < groundCols.length && plants.length < targetCount; i++) {
            var pos = groundCols[i];
            var tooClose = false;
            for (var p = 0; p < plants.length; p++) {
                if (Math.abs(plants[p].col - pos.col) < AP.MIN_SPACING_COLS) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;
            plants.push(pos);
        }

        // Create plant objects
        return plants.map(function (p) {
            return new AcidPlant(p.col * TILE.SIZE, p.row * TILE.SIZE);
        });
    }

    SpaceBoy.AcidPlant = AcidPlant;
    SpaceBoy.generateAcidPlants = generatePlants;
})();
