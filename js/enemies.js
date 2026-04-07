// =============================================================================
// Space Boy! — Enemies (Walker, Charger, Flyer)
// Pulsating neon blobs with health, hit flash, and hit particles.
// Enemy stats come from ENEMY_TYPES registry in constants.js.
// =============================================================================

(function () {
    var ENEMY = SpaceBoy.ENEMY;
    var TYPES = SpaceBoy.ENEMY_TYPES;
    var TILE = SpaceBoy.TILE;
    var PHYSICS = SpaceBoy.PHYSICS;

    // =========================================================================
    // Enemy projectiles (e.g. frogger acid). Main loop updates/checks these.
    // Each projectile: {x, y, vx, vy, radius, damage, life, color, glow, gravity}
    // =========================================================================
    var enemyProjectiles = [];

    function updateEnemyProjectiles(dt, level) {
        for (var i = enemyProjectiles.length - 1; i >= 0; i--) {
            var p = enemyProjectiles[i];
            if (p.gravity) p.vy += PHYSICS.GRAVITY * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            // Remove if expired or hit solid tile
            var col = Math.floor(p.x / TILE.SIZE);
            var row = Math.floor(p.y / TILE.SIZE);
            if (p.life <= 0 || level.isSolid(col, row)) {
                enemyProjectiles.splice(i, 1);
            }
        }
    }

    function drawEnemyProjectiles(ctx, camera) {
        for (var i = 0; i < enemyProjectiles.length; i++) {
            var p = enemyProjectiles[i];
            var sx = p.x - camera.x;
            var sy = p.y - camera.y;
            // Glow
            ctx.fillStyle = p.glow;
            ctx.beginPath();
            ctx.arc(sx, sy, p.radius + 4, 0, Math.PI * 2);
            ctx.fill();
            // Core
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(sx, sy, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function clearEnemyProjectiles() {
        enemyProjectiles.length = 0;
    }

    // =========================================================================
    // Hit particles — radiate from enemy when damaged but not killed
    // =========================================================================
    var particles = [];

    function spawnHitParticles(x, y, color) {
        var count = ENEMY.HIT_PARTICLE_COUNT;
        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            var speed = ENEMY.HIT_PARTICLE_SPEED * (0.6 + Math.random() * 0.4);
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: ENEMY.HIT_PARTICLE_LIFE,
                maxLife: ENEMY.HIT_PARTICLE_LIFE,
                color: color,
            });
        }
    }

    function updateParticles(dt) {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function drawParticles(ctx, camera) {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var alpha = p.life / p.maxLife;
            var sx = p.x - camera.x;
            var sy = p.y - camera.y;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(sx, sy, ENEMY.HIT_PARTICLE_SIZE * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function clearParticles() {
        particles.length = 0;
    }

    // =========================================================================
    // Shared blob drawing
    // =========================================================================
    function drawEnemyBlob(ctx, sx, sy, w, h, time, color, colorDark, glowColor, hitFlash) {
        var cx = sx + w / 2;
        var cy = sy + h / 2;

        var pulse = 1 + Math.sin(time * ENEMY.PULSE_SPEED * Math.PI * 2) * ENEMY.PULSE_AMP;
        var rx = (w / 2) * pulse;
        var ry = (h / 2) * pulse;

        // Neon glow
        var glowR = Math.max(rx, ry) + ENEMY.GLOW_RADIUS;
        var glowGrad = ctx.createRadialGradient(cx, cy, Math.max(rx, ry) * 0.5, cx, cy, glowR);
        glowGrad.addColorStop(0, hitFlash ? 'rgba(255,255,255,0.6)' : glowColor);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Wobbling blob body
        var n = ENEMY.BLOB_POINTS;
        ctx.beginPath();
        for (var i = 0; i <= n; i++) {
            var angle = (i / n) * Math.PI * 2;
            var wobble = Math.sin(time * ENEMY.BLOB_WOBBLE_SPEED + i * 1.9) * ENEMY.BLOB_WOBBLE_AMP;
            var px = cx + Math.cos(angle) * (rx + wobble);
            var py = cy + Math.sin(angle) * (ry + wobble * 0.7);

            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                var prevAngle = ((i - 1) / n) * Math.PI * 2;
                var prevWobble = Math.sin(time * ENEMY.BLOB_WOBBLE_SPEED + (i - 1) * 1.9) * ENEMY.BLOB_WOBBLE_AMP;
                var prevX = cx + Math.cos(prevAngle) * (rx + prevWobble);
                var prevY = cy + Math.sin(prevAngle) * (ry + prevWobble * 0.7);
                var midX = (prevX + px) / 2;
                var midY = (prevY + py) / 2;
                ctx.quadraticCurveTo(prevX, prevY, midX, midY);
            }
        }
        ctx.closePath();

        // Fill: white flash on hit, normal gradient otherwise
        if (hitFlash) {
            ctx.fillStyle = '#ffffff';
        } else {
            var grad = ctx.createRadialGradient(cx - 2, cy - 3, 1, cx, cy, Math.max(rx, ry));
            grad.addColorStop(0, color);
            grad.addColorStop(1, colorDark);
            ctx.fillStyle = grad;
        }
        ctx.fill();

        // Outline glow
        ctx.strokeStyle = hitFlash ? '#ffffff' : color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = hitFlash ? '#ffffff' : color;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        return { cx: cx, cy: cy };
    }

    function drawEnemyEyes(ctx, cx, cy, vx) {
        var eyeSpacing = 3;
        var eyeY = cy - 2;
        var lookDir = vx > 0 ? 1 : -1;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing, eyeY, ENEMY.EYE_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing + lookDir, eyeY, ENEMY.PUPIL_SIZE, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing, eyeY, ENEMY.EYE_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing + lookDir, eyeY, ENEMY.PUPIL_SIZE, 0, Math.PI * 2);
        ctx.fill();
    }

    // =========================================================================
    // Base enemy — health, hit flash, damage
    // =========================================================================
    class Enemy {
        constructor(x, y, typeName) {
            var cfg = TYPES[typeName];
            this.x = x;
            this.y = y;
            this.width = cfg.WIDTH;
            this.height = cfg.HEIGHT;
            this.color = cfg.COLOR;
            this.colorDark = cfg.COLOR_DARK;
            this.colorGlow = cfg.COLOR_GLOW;
            this.health = cfg.HEALTH;
            this.maxHealth = cfg.HEALTH;
            this.scoreValue = cfg.SCORE;
            this.alive = true;
            this.vx = 0;
            this.vy = 0;
            this.type = typeName;
            this.blobTime = Math.random() * 10;
            this.hitFlashTimer = 0;
            this.injured = false;
            this.dripTimer = 0;
        }

        updateDrip(dt) {
            if (!this.injured || !this.alive) return;
            this.dripTimer -= dt;
            if (this.dripTimer <= 0) {
                this.dripTimer = ENEMY.DRIP_INTERVAL;
                // Spawn a few leak particles from random spot on body
                var cx = this.x + this.width / 2;
                var cy = this.y + this.height / 2;
                var count = ENEMY.DRIP_PARTICLE_COUNT;
                for (var i = 0; i < count; i++) {
                    var angle = Math.random() * Math.PI * 2;
                    var speed = ENEMY.DRIP_PARTICLE_SPEED * (0.5 + Math.random() * 0.5);
                    var ox = (Math.random() - 0.5) * this.width * 0.6;
                    var oy = (Math.random() - 0.5) * this.height * 0.6;
                    particles.push({
                        x: cx + ox,
                        y: cy + oy,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 30,
                        life: ENEMY.DRIP_PARTICLE_LIFE,
                        maxLife: ENEMY.DRIP_PARTICLE_LIFE,
                        color: this.color,
                    });
                }
            }
        }

        takeDamage(dmg) {
            if (!this.alive) return false;
            this.health -= dmg;
            if (this.health <= 0) {
                this.alive = false;
                return true; // killed
            }
            // Damaged but alive — flash, burst, and start leaking
            this.hitFlashTimer = ENEMY.HIT_FLASH_TIME;
            this.injured = true;
            spawnHitParticles(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.color
            );
            return false; // not killed
        }

        draw(ctx, camera) {
            if (!this.alive) return;
            var sx = this.x - camera.x;
            var sy = this.y - camera.y;
            ctx.fillStyle = this.color;
            ctx.fillRect(sx, sy, this.width, this.height);
        }
    }

    // =========================================================================
    // Walker — slow patrolling red blob with angry brow
    // =========================================================================
    class Walker extends Enemy {
        constructor(x, y) {
            super(x, y, 'walker');
            this.vx = TYPES.walker.SPEED;
        }

        update(dt, level) {
            if (!this.alive) return;
            this.blobTime += dt;
            if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
            this.updateDrip(dt);

            this.x += this.vx * dt;

            var frontCol = Math.floor((this.vx > 0 ? this.x + this.width : this.x - 1) / TILE.SIZE);
            var footRow = Math.floor((this.y + this.height) / TILE.SIZE);
            var bodyRow = Math.floor((this.y + this.height / 2) / TILE.SIZE);

            if (level.isSolid(frontCol, bodyRow)) {
                this.vx *= -1;
                this.x += this.vx * dt;
            } else if (!level.isSolid(frontCol, footRow)) {
                this.vx *= -1;
                this.x += this.vx * dt;
            }
        }

        draw(ctx, camera) {
            if (!this.alive) return;
            var sx = this.x - camera.x;
            var sy = this.y - camera.y;
            var flash = this.hitFlashTimer > 0;

            ctx.save();
            var center = drawEnemyBlob(ctx, sx, sy, this.width, this.height,
                this.blobTime, this.color, this.colorDark, this.colorGlow, flash);
            if (!flash) {
                drawEnemyEyes(ctx, center.cx, center.cy, this.vx);
                // Angry eyebrows
                var browDir = this.vx > 0 ? 1 : -1;
                ctx.strokeStyle = this.colorDark;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(center.cx - 5, center.cy - 6);
                ctx.lineTo(center.cx - 1, center.cy - 4 - browDir);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(center.cx + 5, center.cy - 6);
                ctx.lineTo(center.cx + 1, center.cy - 4 + browDir);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // =========================================================================
    // Charger — orange blob, flattens when charging, halloween teeth
    // =========================================================================
    class Charger extends Enemy {
        constructor(x, y) {
            super(x, y, 'charger');
            this.vx = TYPES.charger.PATROL_SPEED;
            this.charging = false;
        }

        update(dt, level, player) {
            if (!this.alive) return;
            this.blobTime += dt;
            if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
            this.updateDrip(dt);

            var dx = player.x - this.x;
            var dy = player.y - this.y;
            var dist = Math.sqrt(dx * dx + dy * dy);

            if (!this.charging && dist < TYPES.charger.SIGHT_RANGE && Math.abs(dy) < this.height * 2) {
                this.charging = true;
                this.vx = dx > 0 ? TYPES.charger.CHARGE_SPEED : -TYPES.charger.CHARGE_SPEED;
            }

            if (!this.charging) {
                this.x += this.vx * dt;
                var frontCol = Math.floor((this.vx > 0 ? this.x + this.width : this.x - 1) / TILE.SIZE);
                var footRow = Math.floor((this.y + this.height) / TILE.SIZE);
                var bodyRow = Math.floor((this.y + this.height / 2) / TILE.SIZE);
                if (level.isSolid(frontCol, bodyRow) || !level.isSolid(frontCol, footRow)) {
                    this.vx *= -1;
                    this.x += this.vx * dt;
                }
            } else {
                this.x += this.vx * dt;
                var frontCol = Math.floor((this.vx > 0 ? this.x + this.width : this.x - 1) / TILE.SIZE);
                var bodyRow = Math.floor((this.y + this.height / 2) / TILE.SIZE);
                if (level.isSolid(frontCol, bodyRow)) {
                    this.vx *= -1;
                    this.charging = false;
                }
            }
        }

        draw(ctx, camera) {
            if (!this.alive) return;
            var sx = this.x - camera.x;
            var sy = this.y - camera.y;
            var flash = this.hitFlashTimer > 0;

            var drawW = this.width;
            var drawH = this.height;
            var drawY = sy;
            if (this.charging) {
                drawW = this.width * 1.3;
                drawH = this.height * 0.75;
                drawY = sy + (this.height - drawH);
                sx -= (drawW - this.width) / 2;
            }

            ctx.save();
            var center = drawEnemyBlob(ctx, sx, drawY, drawW, drawH,
                this.blobTime, this.color, this.colorDark, this.colorGlow, flash);

            if (!flash) {
                drawEnemyEyes(ctx, center.cx, center.cy, this.vx);

                // Halloween jack-o-lantern teeth
                var mouthY = center.cy + 2;
                var mouthW = 12;
                var teethCount = 5;
                var toothW = mouthW / teethCount;
                var toothH = 5;
                var mouthLeft = center.cx - mouthW / 2;

                ctx.fillStyle = '#1a0a00';
                ctx.beginPath();
                ctx.moveTo(mouthLeft, mouthY);
                ctx.lineTo(mouthLeft + mouthW, mouthY);
                ctx.lineTo(mouthLeft + mouthW, mouthY + toothH + 2);
                ctx.lineTo(mouthLeft, mouthY + toothH + 2);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#ffdd44';
                for (var i = 0; i < teethCount; i++) {
                    var tx = mouthLeft + i * toothW;
                    var tH = (i % 2 === 0) ? toothH : toothH * 0.6;
                    ctx.beginPath();
                    ctx.moveTo(tx, mouthY);
                    ctx.lineTo(tx + toothW / 2, mouthY + tH);
                    ctx.lineTo(tx + toothW, mouthY);
                    ctx.closePath();
                    ctx.fill();
                }

                var bottomY = mouthY + toothH + 2;
                for (var i = 0; i < teethCount; i++) {
                    var tx = mouthLeft + i * toothW + toothW / 2;
                    if (tx + toothW / 2 > mouthLeft + mouthW) continue;
                    var tH = (i % 2 === 0) ? toothH * 0.5 : toothH * 0.8;
                    ctx.beginPath();
                    ctx.moveTo(tx, bottomY);
                    ctx.lineTo(tx + toothW / 2, bottomY - tH);
                    ctx.lineTo(tx + toothW, bottomY);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.restore();
        }
    }

    // =========================================================================
    // Flyer — purple blob with trailing tendrils
    // =========================================================================
    class Flyer extends Enemy {
        constructor(x, y) {
            super(x, y, 'flyer');
            this.originX = x;
            this.originY = y;
            this.vx = TYPES.flyer.SPEED;
            this.time = Math.random() * Math.PI * 2;
        }

        update(dt, level) {
            if (!this.alive) return;
            this.blobTime += dt;
            if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
            this.updateDrip(dt);

            this.time += dt;
            this.x += this.vx * dt;
            this.y = this.originY + Math.sin(this.time * TYPES.flyer.FREQUENCY * Math.PI * 2) * TYPES.flyer.AMPLITUDE;

            var frontCol = Math.floor((this.vx > 0 ? this.x + this.width : this.x - 1) / TILE.SIZE);
            var bodyRow = Math.floor((this.y + this.height / 2) / TILE.SIZE);
            if (level.isSolid(frontCol, bodyRow)) {
                this.vx *= -1;
            }
        }

        draw(ctx, camera) {
            if (!this.alive) return;
            var sx = this.x - camera.x;
            var sy = this.y - camera.y;
            var cx = sx + this.width / 2;
            var cy = sy + this.height / 2;
            var flash = this.hitFlashTimer > 0;

            ctx.save();

            // Tendrils
            if (!flash) {
                var t = this.blobTime;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.6;
                for (var i = 0; i < 3; i++) {
                    var tendrilX = cx - 5 + i * 5;
                    ctx.beginPath();
                    ctx.moveTo(tendrilX, cy + this.height / 2 - 2);
                    var tendrilLen = 8 + Math.sin(t * 4 + i * 2) * 3;
                    var tendrilSway = Math.sin(t * 3 + i * 1.5) * 4;
                    ctx.quadraticCurveTo(
                        tendrilX + tendrilSway, cy + this.height / 2 + tendrilLen / 2,
                        tendrilX + tendrilSway * 0.5, cy + this.height / 2 + tendrilLen
                    );
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
            }

            var center = drawEnemyBlob(ctx, sx, sy, this.width, this.height,
                this.blobTime, this.color, this.colorDark, this.colorGlow, flash);
            if (!flash) {
                drawEnemyEyes(ctx, center.cx, center.cy, this.vx);
            }

            ctx.restore();
        }
    }

    // =========================================================================
    // Dasher — fast flying kamikaze, 1 HP. Patrols until it spots the player,
    // then dives straight at them at high speed.
    // =========================================================================
    class Dasher extends Enemy {
        constructor(x, y) {
            super(x, y, 'dasher');
            this.originX = x;
            this.originY = y;
            this.vx = TYPES.dasher.PATROL_SPEED;
            this.vy = 0;
            this.time = Math.random() * Math.PI * 2;
            this.dashing = false;
        }

        update(dt, level, player) {
            if (!this.alive) return;
            this.blobTime += dt;
            if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
            this.updateDrip(dt);

            var cfg = TYPES.dasher;

            if (!this.dashing) {
                // Patrol: float with slight bob until player enters sight
                this.time += dt;
                this.x += this.vx * dt;
                this.y = this.originY + Math.sin(this.time * 3) * 6;

                var frontCol = Math.floor((this.vx > 0 ? this.x + this.width : this.x - 1) / TILE.SIZE);
                var bodyRow = Math.floor((this.y + this.height / 2) / TILE.SIZE);
                if (level.isSolid(frontCol, bodyRow)) {
                    this.vx *= -1;
                }

                // Detect player
                var dx = (player.x + player.width / 2) - (this.x + this.width / 2);
                var dy = (player.y + player.height / 2) - (this.y + this.height / 2);
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < cfg.SIGHT_RANGE) {
                    this.dashing = true;
                    var inv = 1 / (dist || 1);
                    this.vx = dx * inv * cfg.DASH_SPEED;
                    this.vy = dy * inv * cfg.DASH_SPEED;
                }
            } else {
                // Dash straight in the locked direction
                this.x += this.vx * dt;
                this.y += this.vy * dt;

                // Die against terrain (kamikaze splat)
                var col = Math.floor((this.x + this.width / 2) / TILE.SIZE);
                var row = Math.floor((this.y + this.height / 2) / TILE.SIZE);
                if (level.isSolid(col, row)) {
                    this.alive = false;
                    spawnHitParticles(this.x + this.width / 2, this.y + this.height / 2, this.color);
                }
            }
        }

        draw(ctx, camera) {
            if (!this.alive) return;
            var sx = this.x - camera.x;
            var sy = this.y - camera.y;
            var flash = this.hitFlashTimer > 0;

            ctx.save();

            // Motion-blur streak behind dasher when dashing
            if (this.dashing && !flash) {
                var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
                var tx = -this.vx / speed * 14;
                var ty = -this.vy / speed * 14;
                ctx.globalAlpha = 0.4;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(sx + this.width / 2, sy + this.height / 2);
                ctx.lineTo(sx + this.width / 2 + tx, sy + this.height / 2 + ty);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }

            var center = drawEnemyBlob(ctx, sx, sy, this.width, this.height,
                this.blobTime, this.color, this.colorDark, this.colorGlow, flash);

            if (!flash) {
                drawEnemyEyes(ctx, center.cx, center.cy, this.vx);

                // Angry underbite fangs — kamikaze teeth
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(center.cx - 4, center.cy + 2);
                ctx.lineTo(center.cx - 2, center.cy + 6);
                ctx.lineTo(center.cx, center.cy + 2);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(center.cx, center.cy + 2);
                ctx.lineTo(center.cx + 2, center.cy + 6);
                ctx.lineTo(center.cx + 4, center.cy + 2);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // =========================================================================
    // Frogger — grounded 3-HP blob that hops and spits acid in a parabolic arc.
    // =========================================================================
    function rand(min, max) { return min + Math.random() * (max - min); }

    class Frogger extends Enemy {
        constructor(x, y) {
            super(x, y, 'frogger');
            this.vx = 0;
            this.vy = 0;
            this.onGround = false;
            this.facingRight = Math.random() < 0.5;
            this.hopCooldown = rand(TYPES.frogger.HOP_INTERVAL_MIN, TYPES.frogger.HOP_INTERVAL_MAX);
            this.shootCooldown = rand(TYPES.frogger.SHOOT_INTERVAL_MIN, TYPES.frogger.SHOOT_INTERVAL_MAX);
            this.hopSquash = 0;     // visual squash-stretch
        }

        update(dt, level, player) {
            if (!this.alive) return;
            this.blobTime += dt;
            if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
            this.updateDrip(dt);

            var cfg = TYPES.frogger;

            // --- Gravity + tile collision (axis-by-axis) ---
            this.vy += PHYSICS.GRAVITY * dt;
            if (this.vy > PHYSICS.TERMINAL_VELOCITY) this.vy = PHYSICS.TERMINAL_VELOCITY;

            // Face player if in sight range
            var dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            if (Math.abs(dx) < cfg.SIGHT_RANGE) {
                this.facingRight = dx > 0;
            }

            // Horizontal move
            this.x += this.vx * dt;
            var col, row;
            if (this.vx !== 0) {
                var edgeX = this.vx > 0 ? this.x + this.width : this.x;
                col = Math.floor(edgeX / TILE.SIZE);
                for (var ry = Math.floor(this.y / TILE.SIZE); ry <= Math.floor((this.y + this.height - 1) / TILE.SIZE); ry++) {
                    if (level.isSolid(col, ry)) {
                        if (this.vx > 0) this.x = col * TILE.SIZE - this.width - 0.01;
                        else this.x = (col + 1) * TILE.SIZE + 0.01;
                        this.vx = 0;
                        this.facingRight = !this.facingRight;
                        break;
                    }
                }
            }

            // Vertical move
            this.y += this.vy * dt;
            this.onGround = false;
            var edgeY = this.vy > 0 ? this.y + this.height : this.y;
            row = Math.floor(edgeY / TILE.SIZE);
            for (var cx = Math.floor(this.x / TILE.SIZE); cx <= Math.floor((this.x + this.width - 1) / TILE.SIZE); cx++) {
                if (level.isSolid(cx, row)) {
                    if (this.vy > 0) {
                        this.y = row * TILE.SIZE - this.height - 0.01;
                        this.onGround = true;
                    } else {
                        this.y = (row + 1) * TILE.SIZE + 0.01;
                    }
                    this.vy = 0;
                    break;
                }
            }

            // --- Hop timer (only when grounded) ---
            if (this.onGround) {
                this.vx = 0;
                this.hopCooldown -= dt;
                if (this.hopCooldown <= 0) {
                    this.hopCooldown = rand(cfg.HOP_INTERVAL_MIN, cfg.HOP_INTERVAL_MAX);
                    this.vy = cfg.HOP_SPEED_Y;
                    this.vx = (this.facingRight ? 1 : -1) * cfg.HOP_SPEED_X;
                    this.hopSquash = 0.6;   // squash before launching (visual)
                }
            }

            if (this.hopSquash > 0) this.hopSquash -= dt * 3;

            // --- Shoot acid (parabolic arc, gravity-affected) ---
            this.shootCooldown -= dt;
            if (this.shootCooldown <= 0 && Math.abs(dx) < cfg.SIGHT_RANGE) {
                this.shootCooldown = rand(cfg.SHOOT_INTERVAL_MIN, cfg.SHOOT_INTERVAL_MAX);
                var dir = this.facingRight ? 1 : -1;
                var mx = this.x + this.width / 2 + dir * (this.width / 2);
                var my = this.y + 4;
                enemyProjectiles.push({
                    x: mx,
                    y: my,
                    vx: dir * cfg.ACID_SPEED_X,
                    vy: cfg.ACID_SPEED_Y,
                    radius: cfg.ACID_RADIUS,
                    damage: cfg.ACID_DAMAGE,
                    life: cfg.ACID_LIFETIME,
                    color: cfg.ACID_COLOR,
                    glow: cfg.ACID_GLOW,
                    gravity: true,
                });
            }
        }

        draw(ctx, camera) {
            if (!this.alive) return;
            var sx = this.x - camera.x;
            var sy = this.y - camera.y;
            var flash = this.hitFlashTimer > 0;

            var cfg = TYPES.frogger;

            // Squash when crouched for a hop
            var drawW = this.width;
            var drawH = this.height;
            var drawY = sy;
            if (this.hopSquash > 0) {
                drawH = this.height * (1 - this.hopSquash * 0.25);
                drawY = sy + (this.height - drawH);
            } else if (!this.onGround) {
                drawH = this.height * 1.08;
                drawW = this.width * 0.92;
                sx += (this.width - drawW) / 2;
            }

            ctx.save();
            var center = drawEnemyBlob(ctx, sx, drawY, drawW, drawH,
                this.blobTime, this.color, this.colorDark, this.colorGlow, flash);

            if (!flash) {
                // Pale belly patch
                ctx.fillStyle = cfg.BELLY_COLOR;
                ctx.beginPath();
                ctx.ellipse(center.cx, center.cy + drawH * 0.2, drawW * 0.3, drawH * 0.18, 0, 0, Math.PI * 2);
                ctx.fill();

                // Big bulging frog eyes
                var eyeOffX = 6;
                var eyeY = center.cy - drawH * 0.28;
                var lookDir = this.facingRight ? 1 : -1;

                ctx.fillStyle = cfg.EYE_COLOR;
                ctx.beginPath();
                ctx.arc(center.cx - eyeOffX, eyeY, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(center.cx + eyeOffX, eyeY, 4, 0, Math.PI * 2);
                ctx.fill();

                // Slit pupils
                ctx.fillStyle = '#111111';
                ctx.beginPath();
                ctx.ellipse(center.cx - eyeOffX + lookDir, eyeY, 1, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(center.cx + eyeOffX + lookDir, eyeY, 1, 3, 0, 0, Math.PI * 2);
                ctx.fill();

                // Wide grin
                ctx.strokeStyle = cfg.COLOR_DARK;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(center.cx, center.cy + 1, 6, 0.1, Math.PI - 0.1);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // =========================================================================
    // Exports
    // =========================================================================
    SpaceBoy.Walker = Walker;
    SpaceBoy.Charger = Charger;
    SpaceBoy.Flyer = Flyer;
    SpaceBoy.Dasher = Dasher;
    SpaceBoy.Frogger = Frogger;
    SpaceBoy.updateEnemyParticles = updateParticles;
    SpaceBoy.drawEnemyParticles = drawParticles;
    SpaceBoy.clearEnemyParticles = clearParticles;
    SpaceBoy.enemyProjectiles = enemyProjectiles;
    SpaceBoy.updateEnemyProjectiles = updateEnemyProjectiles;
    SpaceBoy.drawEnemyProjectiles = drawEnemyProjectiles;
    SpaceBoy.clearEnemyProjectiles = clearEnemyProjectiles;
})();
