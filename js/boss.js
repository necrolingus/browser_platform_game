// =============================================================================
// Space Boy! — Boss Module
// Parameterized boss with pluggable type configs (see SpaceBoy.BOSS_TYPES).
// Handles movement, shooting, health, hit feedback, and death. A drawer for
// each boss visual is registered via SpaceBoy.BossRenderers[typeName].
// =============================================================================

(function () {
    var BOSS = SpaceBoy.BOSS;
    var GAME = SpaceBoy.GAME;
    var LEVEL = SpaceBoy.LEVEL;

    // --- Seedable RNG-ish helpers (kept plain Math.random for organic feel) ---
    function rand(min, max) { return min + Math.random() * (max - min); }
    function randi(min, max) { return Math.floor(rand(min, max + 1)); }

    // =========================================================================
    // Boss class — drives mechanics from a type config. Pure logic here;
    // the visuals live in BossRenderers so a new boss = new config + new drawer.
    // =========================================================================
    class Boss {
        constructor(typeName, arenaBounds) {
            var cfg = SpaceBoy.BOSS_TYPES[typeName];
            if (!cfg) throw new Error('Unknown boss type: ' + typeName);

            this.typeName = typeName;
            this.cfg = cfg;
            this.arena = arenaBounds; // { x, y, width, height }

            this.width = cfg.WIDTH;
            this.height = cfg.HEIGHT;

            // Spawn centered horizontally, hovering near top of arena
            this.x = arenaBounds.x + arenaBounds.width / 2 - this.width / 2;
            this.y = arenaBounds.y + cfg.HOVER_Y_MIN;

            this.vx = 0;
            this.vy = 0;

            // Anchor position that wiggles slowly around the arena
            this._anchorX = this.x;
            this._anchorY = this.y;
            this._t = 0;

            this.health = cfg.HEALTH;
            this.maxHealth = cfg.HEALTH;
            this.scoreValue = cfg.SCORE;
            this.alive = true;
            this.active = false;           // activated when player enters arena
            this.hitFlash = 0;

            // Shooting state
            this._shootTimer = rand(cfg.SHOOT_PAUSE_MIN, cfg.SHOOT_PAUSE_MAX);
            this._bursting = false;
            this._burstRemaining = 0;
            this._burstCooldown = 0;

            // Charge state
            this._chargeTimer = rand(cfg.CHARGE_INTERVAL_MIN, cfg.CHARGE_INTERVAL_MAX);
            this._charging = false;
            this._chargeDuration = 0;
            this._chargeDirX = 0;
            this._chargeDirY = 0;

            // Death sequence
            this._dying = false;
            this._deathTimer = 0;
            this._deathParticles = [];

            // Bullets owned by this boss
            this.bullets = [];

            // --- Triplet-specific state (only used by greyus_triplets) ---
            if (typeName === 'greyus_triplets') {
                this._isTriplet = true;
                this._shotCounter = 0;       // tracks shots fired; every 10th = uber
                this._tripletSize = cfg.TRIPLET_SIZE; // { w, h } per individual saucer

                // Three sub-saucers orbiting the center. Each has its own
                // position offset, orbit phase, and bob offset.
                this._triplets = [];
                for (var ti = 0; ti < 3; ti++) {
                    this._triplets.push({
                        offsetX: 0,
                        offsetY: 0,
                        phase: (ti / 3) * Math.PI * 2, // 120 degrees apart
                    });
                }
            } else {
                this._isTriplet = false;
            }
        }

        activate() {
            if (!this.active && this.alive) {
                this.active = true;
            }
        }

        takeDamage(dmg) {
            if (!this.alive || this._dying) return false;
            this.health -= dmg;
            this.hitFlash = BOSS.HIT_FLASH_TIME;
            if (this.health <= 0) {
                this.health = 0;
                this._startDeath();
                return true;
            }
            return false;
        }

        _startDeath() {
            this._dying = true;
            this._deathTimer = BOSS.DEATH_EXPLOSION_TIME;

            // Spawn explosion particles from each sub-rect (or 1 for normal boss)
            var centers = [];
            if (this._isTriplet) {
                var bcx = this.x + this.width / 2;
                var bcy = this.y + this.height / 2;
                for (var ti = 0; ti < 3; ti++) {
                    var tri = this._triplets[ti];
                    centers.push({ x: bcx + tri.offsetX, y: bcy + tri.offsetY });
                }
            } else {
                centers.push({ x: this.x + this.width / 2, y: this.y + this.height / 2 });
            }

            var perCenter = Math.ceil(BOSS.DEATH_PARTICLE_COUNT / centers.length);
            for (var ci = 0; ci < centers.length; ci++) {
                var cx = centers[ci].x;
                var cy = centers[ci].y;
                for (var i = 0; i < perCenter; i++) {
                    var a = Math.random() * Math.PI * 2;
                    var s = 80 + Math.random() * 260;
                    this._deathParticles.push({
                        x: cx, y: cy,
                        vx: Math.cos(a) * s,
                        vy: Math.sin(a) * s,
                        life: 0.6 + Math.random() * 0.8,
                        size: 2 + Math.random() * 4,
                        color: Math.random() < 0.5 ? '#ffcc33' : '#ff6633',
                    });
                }
            }
        }

        /** True rect used for hit testing & collisions (single-boss) */
        rect() {
            return { x: this.x, y: this.y, width: this.width, height: this.height };
        }

        /** Returns array of rects to test against (1 for normal, 3 for triplets) */
        hitRects() {
            if (!this._isTriplet) return [this.rect()];
            var cx = this.x + this.width / 2;
            var cy = this.y + this.height / 2;
            var ts = this.cfg.TRIPLET_SIZE;
            var rects = [];
            for (var ti = 0; ti < 3; ti++) {
                var tri = this._triplets[ti];
                rects.push({
                    x: cx + tri.offsetX - ts.w / 2,
                    y: cy + tri.offsetY - ts.h / 2,
                    width: ts.w,
                    height: ts.h,
                });
            }
            return rects;
        }

        /** Test if a circle (bullet) hits any of the boss's sub-rects */
        hitTest(bx, by, radius) {
            var rects = this.hitRects();
            for (var i = 0; i < rects.length; i++) {
                var r = rects[i];
                if (bx + radius > r.x && bx - radius < r.x + r.width &&
                    by + radius > r.y && by - radius < r.y + r.height) {
                    return true;
                }
            }
            return false;
        }

        /** Test if the player's AABB overlaps any of the boss's sub-rects */
        contactTest(player) {
            var rects = this.hitRects();
            for (var i = 0; i < rects.length; i++) {
                var r = rects[i];
                if (player.x < r.x + r.width && player.x + player.width > r.x &&
                    player.y < r.y + r.height && player.y + player.height > r.y) {
                    return true;
                }
            }
            return false;
        }

        update(dt, player) {
            if (!this.alive) return;

            // --- Death sequence ---
            if (this._dying) {
                this._deathTimer -= dt;
                for (var i = this._deathParticles.length - 1; i >= 0; i--) {
                    var p = this._deathParticles[i];
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vy += 200 * dt;
                    p.life -= dt;
                    if (p.life <= 0) this._deathParticles.splice(i, 1);
                }
                if (this._deathTimer <= 0) {
                    this.alive = false;
                }
                // still update bullets so they don't freeze mid-air
                this._updateBullets(dt);
                return;
            }

            if (!this.active) return;

            this._t += dt;
            var cfg = this.cfg;

            if (this.hitFlash > 0) this.hitFlash -= dt;

            // --- Wiggle anchor around arena center ---
            var cx = this.arena.x + this.arena.width / 2;
            var cy = this.arena.y + (cfg.HOVER_Y_MIN + cfg.HOVER_Y_MAX) / 2;
            var targetX = cx + Math.sin(this._t * cfg.WIGGLE_FREQ_X * Math.PI * 2) * cfg.WIGGLE_AMP_X - this.width / 2;
            var targetY = cy + Math.cos(this._t * cfg.WIGGLE_FREQ_Y * Math.PI * 2) * cfg.WIGGLE_AMP_Y - this.height / 2;

            // --- Charge timing ---
            if (!this._charging) {
                this._chargeTimer -= dt;
                if (this._chargeTimer <= 0) {
                    this._charging = true;
                    this._chargeDuration = cfg.CHARGE_DURATION;
                    // Charge toward a random offset around the player but respect min distance
                    var px = player.x + player.width / 2;
                    var py = player.y + player.height / 2;
                    var bx = this.x + this.width / 2;
                    var by = this.y + this.height / 2;
                    var dx = px - bx;
                    var dy = py - by;
                    var len = Math.hypot(dx, dy) || 1;
                    this._chargeDirX = dx / len;
                    this._chargeDirY = dy / len;
                }
            } else {
                this._chargeDuration -= dt;
                if (this._chargeDuration <= 0) {
                    this._charging = false;
                    this._chargeTimer = rand(cfg.CHARGE_INTERVAL_MIN, cfg.CHARGE_INTERVAL_MAX);
                }
            }

            // --- Move toward target (or charge) ---
            if (this._charging) {
                this.x += this._chargeDirX * cfg.CHARGE_SPEED * dt;
                this.y += this._chargeDirY * cfg.CHARGE_SPEED * dt;
            } else {
                var mdx = targetX - this.x;
                var mdy = targetY - this.y;
                var mlen = Math.hypot(mdx, mdy);
                if (mlen > 1) {
                    var step = Math.min(mlen, cfg.MOVE_SPEED * dt);
                    this.x += (mdx / mlen) * step;
                    this.y += (mdy / mlen) * step;
                }
            }

            // --- Enforce min distance from player (level 1: stay back) ---
            var pcx = player.x + player.width / 2;
            var pcy = player.y + player.height / 2;
            var bcx = this.x + this.width / 2;
            var bcy = this.y + this.height / 2;
            var ddx = bcx - pcx;
            var ddy = bcy - pcy;
            var dist = Math.hypot(ddx, ddy);
            if (dist < cfg.MIN_DISTANCE_FROM_PLAYER && dist > 0.01) {
                var push = (cfg.MIN_DISTANCE_FROM_PLAYER - dist);
                this.x += (ddx / dist) * push;
                this.y += (ddy / dist) * push;
                // Cancel a charge that would have put the boss on top of the player
                this._charging = false;
            }

            // --- Clamp inside arena bounds ---
            if (this.x < this.arena.x + 10) this.x = this.arena.x + 10;
            if (this.x + this.width > this.arena.x + this.arena.width - 10)
                this.x = this.arena.x + this.arena.width - this.width - 10;
            if (this.y < this.arena.y + 10) this.y = this.arena.y + 10;
            var maxY = this.arena.y + cfg.HOVER_Y_MAX;
            if (this.y > maxY) this.y = maxY;

            // --- Triplet orbit (update sub-saucer offsets) ---
            if (this._isTriplet) {
                var orbitR = cfg.TRIPLET_ORBIT_RADIUS;
                var orbitSpeed = cfg.TRIPLET_ORBIT_SPEED;
                for (var ti = 0; ti < 3; ti++) {
                    var tri = this._triplets[ti];
                    var angle = this._t * orbitSpeed * Math.PI * 2 + tri.phase;
                    tri.offsetX = Math.cos(angle) * orbitR;
                    tri.offsetY = Math.sin(angle) * orbitR * 0.5; // flatter orbit
                }
            }

            // --- Shooting: randomized bursts with pauses ---
            if (!this._bursting) {
                this._shootTimer -= dt;
                if (this._shootTimer <= 0) {
                    this._bursting = true;
                    this._burstRemaining = randi(cfg.SHOOT_BURST_MIN, cfg.SHOOT_BURST_MAX);
                    this._burstCooldown = 0;
                }
            } else {
                this._burstCooldown -= dt;
                if (this._burstCooldown <= 0) {
                    this._fireAtPlayer(player);
                    this._burstRemaining--;
                    this._burstCooldown = cfg.SHOOT_BURST_INTERVAL;
                    if (this._burstRemaining <= 0) {
                        this._bursting = false;
                        this._shootTimer = rand(cfg.SHOOT_PAUSE_MIN, cfg.SHOOT_PAUSE_MAX);
                    }
                }
            }

            this._updateBullets(dt);
        }

        _fireAtPlayer(player) {
            var cfg = this.cfg;
            var px = player.x + player.width / 2;
            var py = player.y + player.height / 2;

            if (this._isTriplet) {
                // Fire one bullet from each of the 3 saucers
                var ts = cfg.TRIPLET_SIZE;
                for (var ti = 0; ti < 3; ti++) {
                    var tri = this._triplets[ti];
                    var bx = this.x + this.width / 2 + tri.offsetX;
                    var by = this.y + this.height / 2 + tri.offsetY + ts.h * 0.3;
                    var angle = Math.atan2(py - by, px - bx);
                    angle += (Math.random() - 0.5) * 2 * cfg.SHOOT_SPREAD;

                    this._shotCounter++;
                    var isUber = (this._shotCounter % cfg.UBER_EVERY === 0);
                    this.bullets.push({
                        x: bx,
                        y: by,
                        vx: Math.cos(angle) * (isUber ? cfg.UBER_SPEED : cfg.BULLET_SPEED),
                        vy: Math.sin(angle) * (isUber ? cfg.UBER_SPEED : cfg.BULLET_SPEED),
                        life: cfg.BULLET_LIFE,
                        radius: isUber ? cfg.UBER_RADIUS : cfg.BULLET_RADIUS,
                        damage: cfg.BULLET_DAMAGE,
                        isUber: isUber,
                    });
                }
            } else {
                var bx = this.x + this.width / 2;
                var by = this.y + this.height * 0.65;
                var angle = Math.atan2(py - by, px - bx);
                angle += (Math.random() - 0.5) * 2 * cfg.SHOOT_SPREAD;
                this.bullets.push({
                    x: bx,
                    y: by,
                    vx: Math.cos(angle) * cfg.BULLET_SPEED,
                    vy: Math.sin(angle) * cfg.BULLET_SPEED,
                    life: cfg.BULLET_LIFE,
                    radius: cfg.BULLET_RADIUS,
                    damage: cfg.BULLET_DAMAGE,
                });
            }
        }

        _updateBullets(dt) {
            for (var i = this.bullets.length - 1; i >= 0; i--) {
                var b = this.bullets[i];
                b.x += b.vx * dt;
                b.y += b.vy * dt;
                b.life -= dt;
                if (b.life <= 0) { this.bullets.splice(i, 1); continue; }
                // despawn if off-arena
                if (b.x < this.arena.x - 20 || b.x > this.arena.x + this.arena.width + 20 ||
                    b.y < -20 || b.y > LEVEL.HEIGHT_PX + 20) {
                    this.bullets.splice(i, 1);
                }
            }
        }

        /** Test if a boss bullet hit the player. Returns 'uber' for an
         *  insta-kill hit, true for a normal hit, or false for no hit. */
        checkBulletHitsPlayer(player) {
            for (var i = this.bullets.length - 1; i >= 0; i--) {
                var b = this.bullets[i];
                if (b.x + b.radius > player.x &&
                    b.x - b.radius < player.x + player.width &&
                    b.y + b.radius > player.y &&
                    b.y - b.radius < player.y + player.height) {
                    var wasUber = b.isUber;
                    this.bullets.splice(i, 1);
                    return wasUber ? 'uber' : true;
                }
            }
            return false;
        }

        draw(ctx, camera) {
            // Death particles
            if (this._dying) {
                for (var i = 0; i < this._deathParticles.length; i++) {
                    var p = this._deathParticles[i];
                    ctx.globalAlpha = Math.max(0, p.life);
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }

            // Main body — delegated to type-specific renderer
            if (!this._dying || this._deathTimer > BOSS.DEATH_EXPLOSION_TIME * 0.5) {
                var renderer = SpaceBoy.BossRenderers && SpaceBoy.BossRenderers[this.typeName];
                if (renderer) renderer(ctx, this, camera);
            }

            // Bullets (always visible during death too)
            this._drawBullets(ctx, camera);

            // Health bar
            if (this.active && !this._dying) {
                this._drawHealthBar(ctx, camera);
            }
        }

        _drawBullets(ctx, camera) {
            var cfg = this.cfg;
            for (var i = 0; i < this.bullets.length; i++) {
                var b = this.bullets[i];
                var sx = b.x - camera.x;
                var sy = b.y - camera.y;

                if (b.isUber) {
                    // Uber bullet — pulsating red/white menacing glow
                    var pulse = 0.7 + 0.3 * Math.sin(performance.now() / 60);
                    ctx.fillStyle = 'rgba(255,0,0,' + (0.5 * pulse) + ')';
                    ctx.beginPath();
                    ctx.arc(sx, sy, b.radius * 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ff0000';
                    ctx.beginPath();
                    ctx.arc(sx, sy, b.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(sx, sy, b.radius * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = cfg.BULLET_GLOW;
                    ctx.beginPath();
                    ctx.arc(sx, sy, b.radius * 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = cfg.BULLET_COLOR;
                    ctx.beginPath();
                    ctx.arc(sx, sy, b.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        _drawHealthBar(ctx, camera) {
            var w = BOSS.HEALTH_BAR_WIDTH;
            var h = BOSS.HEALTH_BAR_HEIGHT;
            var cx = (this.x + this.width / 2) - camera.x;
            var sy = this.y - camera.y + BOSS.HEALTH_BAR_OFFSET_Y;
            var bx = cx - w / 2;

            // Glow
            ctx.shadowColor = BOSS.HEALTH_BAR_GLOW;
            ctx.shadowBlur = 10;

            ctx.fillStyle = BOSS.HEALTH_BAR_BG;
            ctx.fillRect(bx, sy, w, h);

            var frac = Math.max(0, this.health / this.maxHealth);
            ctx.fillStyle = BOSS.HEALTH_BAR_FILL;
            ctx.fillRect(bx, sy, w * frac, h);

            ctx.shadowBlur = 0;

            ctx.strokeStyle = BOSS.HEALTH_BAR_BORDER;
            ctx.lineWidth = 1;
            ctx.strokeRect(bx + 0.5, sy + 0.5, w - 1, h - 1);

            // Name label
            ctx.fillStyle = '#ffffff';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.cfg.NAME + '  ' + this.health + '/' + this.maxHealth, cx, sy - 3);
            ctx.textAlign = 'left';
        }
    }

    // =========================================================================
    // Boss renderers — one per boss type. Registered on SpaceBoy.BossRenderers.
    // =========================================================================
    SpaceBoy.BossRenderers = SpaceBoy.BossRenderers || {};

    // --- Level 1: Grey alien in a flying saucer ---
    SpaceBoy.BossRenderers.alien_saucer = function (ctx, boss, camera) {
        var cfg = boss.cfg;
        var sx = boss.x - camera.x;
        var sy = boss.y - camera.y;
        var cx = sx + boss.width / 2;
        var cy = sy + boss.height / 2;
        var w = boss.width;
        var h = boss.height;

        // Tiny float bob in addition to wiggle
        var bob = Math.sin(boss._t * 3) * 3;

        ctx.save();
        ctx.translate(0, bob);

        // Hit flash — tint white if recently hit
        var hitTint = boss.hitFlash > 0 ? (boss.hitFlash / SpaceBoy.BOSS.HIT_FLASH_TIME) : 0;

        // ========================================================
        // Flying saucer — bottom 60% of bounding box
        // ========================================================
        var saucerCy = sy + h * 0.62;
        var saucerRx = w * 0.5;
        var saucerRy = h * 0.14;

        // Underside glow (tractor beam feel)
        var glowGrad = ctx.createRadialGradient(cx, saucerCy + saucerRy, 4, cx, saucerCy + saucerRy + 40, saucerRx);
        glowGrad.addColorStop(0, 'rgba(180,220,255,0.35)');
        glowGrad.addColorStop(1, 'rgba(180,220,255,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.ellipse(cx, saucerCy + saucerRy + 20, saucerRx * 1.1, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Saucer body (ellipse)
        var bodyGrad = ctx.createLinearGradient(cx, saucerCy - saucerRy, cx, saucerCy + saucerRy);
        bodyGrad.addColorStop(0, cfg.COLOR_SAUCER_BODY);
        bodyGrad.addColorStop(0.5, cfg.COLOR_SAUCER_TOP);
        bodyGrad.addColorStop(1, cfg.COLOR_SAUCER_DARK);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(cx, saucerCy, saucerRx, saucerRy, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = cfg.COLOR_SAUCER_RIM;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rim lights (blinking)
        var lightCount = 7;
        for (var i = 0; i < lightCount; i++) {
            var lx = cx - saucerRx * 0.8 + (i / (lightCount - 1)) * saucerRx * 1.6;
            var ly = saucerCy + saucerRy * 0.4;
            var blink = 0.4 + 0.6 * Math.abs(Math.sin(boss._t * 6 + i));
            ctx.fillStyle = cfg.COLOR_SAUCER_LIGHT;
            ctx.globalAlpha = blink;
            ctx.beginPath();
            ctx.arc(lx, ly, 2.8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // ========================================================
        // Dome — transparent bubble containing the alien head
        // ========================================================
        var domeCy = sy + h * 0.44;
        var domeRx = w * 0.32;
        var domeRy = h * 0.24;

        // Dome back plate (to set off the alien inside)
        var domeGrad = ctx.createRadialGradient(cx - domeRx * 0.3, domeCy - domeRy * 0.4, 4, cx, domeCy, domeRx);
        domeGrad.addColorStop(0, 'rgba(220,240,255,0.75)');
        domeGrad.addColorStop(0.7, 'rgba(140,180,220,0.45)');
        domeGrad.addColorStop(1, 'rgba(80,110,150,0.55)');
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.ellipse(cx, domeCy, domeRx, domeRy, 0, 0, Math.PI * 2);
        ctx.fill();

        // ========================================================
        // Alien head inside dome
        // ========================================================
        var headCy = domeCy + domeRy * 0.1;
        var headRx = domeRx * 0.72;
        var headRy = domeRy * 0.85;

        // Head shape (teardrop-ish — wider at top, pointed chin)
        ctx.fillStyle = cfg.COLOR_ALIEN_SKIN;
        ctx.beginPath();
        ctx.moveTo(cx, headCy - headRy);                                 // top of head
        ctx.bezierCurveTo(cx + headRx * 1.1, headCy - headRy,
                          cx + headRx,       headCy + headRy * 0.2,
                          cx,                headCy + headRy);           // chin
        ctx.bezierCurveTo(cx - headRx,       headCy + headRy * 0.2,
                          cx - headRx * 1.1, headCy - headRy,
                          cx,                headCy - headRy);
        ctx.fill();

        // Head shading (right side)
        ctx.fillStyle = cfg.COLOR_ALIEN_SKIN_DARK;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(cx + headRx * 0.3, headCy + headRy * 0.1, headRx * 0.6, headRy * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Big black almond eyes — track the player slightly
        var eyeRx = headRx * 0.35;
        var eyeRy = headRy * 0.45;
        var eyeSpacing = headRx * 0.42;
        var eyeY = headCy - headRy * 0.05;

        // Eye slant (almond shape) — rotate each eye
        function drawEye(sign) {
            ctx.save();
            ctx.translate(cx + sign * eyeSpacing, eyeY);
            ctx.rotate(sign * 0.35);
            ctx.fillStyle = cfg.COLOR_ALIEN_EYE;
            ctx.beginPath();
            ctx.ellipse(0, 0, eyeRx, eyeRy, 0, 0, Math.PI * 2);
            ctx.fill();
            // Highlight
            ctx.fillStyle = cfg.COLOR_ALIEN_EYE_HL;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.ellipse(-eyeRx * 0.3, -eyeRy * 0.5, eyeRx * 0.18, eyeRy * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();
        }
        drawEye(-1);
        drawEye(1);

        // Tiny slit mouth
        ctx.strokeStyle = cfg.COLOR_ALIEN_SKIN_DARK;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - headRx * 0.12, headCy + headRy * 0.55);
        ctx.lineTo(cx + headRx * 0.12, headCy + headRy * 0.55);
        ctx.stroke();

        // Dome rim (metal ring around the dome base)
        ctx.strokeStyle = cfg.COLOR_SAUCER_RIM;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx, domeCy + domeRy, domeRx, domeRy * 0.25, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Dome highlight (top-left gloss)
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx - domeRx * 0.4, domeCy - domeRy * 0.5, domeRx * 0.25, domeRy * 0.35, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Hit flash — overlay white
        if (hitTint > 0) {
            ctx.fillStyle = 'rgba(255,255,255,' + (0.6 * hitTint) + ')';
            ctx.beginPath();
            ctx.ellipse(cx, saucerCy, saucerRx, saucerRy, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx, domeCy, domeRx, domeRy, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    // --- Level 2: Greyus Prime Plus, emo edition ---
    // Reuses the alien_saucer drawer for the chassis (already pulls black +
    // pink colors from cfg) and overlays a black emo hairdo + eyeliner.
    SpaceBoy.BossRenderers.emo_saucer = function (ctx, boss, camera) {
        // Draw the base saucer + alien using the existing renderer.
        SpaceBoy.BossRenderers.alien_saucer(ctx, boss, camera);

        var cfg = boss.cfg;
        var sx = boss.x - camera.x;
        var sy = boss.y - camera.y;
        var w = boss.width;
        var h = boss.height;
        var cx = sx + w / 2;
        var bob = Math.sin(boss._t * 3) * 3;

        ctx.save();
        ctx.translate(0, bob);

        // Recompute the same head metrics the base renderer used so the
        // overlays line up exactly.
        var domeCy = sy + h * 0.44;
        var domeRx = w * 0.32;
        var domeRy = h * 0.24;
        var headCy = domeCy + domeRy * 0.1;
        var headRx = domeRx * 0.72;
        var headRy = domeRy * 0.85;

        // ---- Eyeliner: smudged black ring around each almond eye ----
        var eyeRx = headRx * 0.35;
        var eyeRy = headRy * 0.45;
        var eyeSpacing = headRx * 0.42;
        var eyeY = headCy - headRy * 0.05;

        function drawEyeliner(sign) {
            ctx.save();
            ctx.translate(cx + sign * eyeSpacing, eyeY);
            ctx.rotate(sign * 0.35);
            // Outer smudge
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            ctx.beginPath();
            ctx.ellipse(0, 0, eyeRx * 1.45, eyeRy * 1.35, 0, 0, Math.PI * 2);
            ctx.fill();
            // Hard liner ring
            ctx.strokeStyle = cfg.COLOR_EYELINER;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.ellipse(0, 0, eyeRx * 1.18, eyeRy * 1.12, 0, 0, Math.PI * 2);
            ctx.stroke();
            // Tear-drop drip below the outer corner
            ctx.fillStyle = cfg.COLOR_EYELINER;
            ctx.beginPath();
            ctx.moveTo(eyeRx * 0.6, eyeRy * 0.9);
            ctx.quadraticCurveTo(eyeRx * 0.95, eyeRy * 1.6, eyeRx * 0.45, eyeRy * 1.7);
            ctx.quadraticCurveTo(eyeRx * 0.55, eyeRy * 1.3, eyeRx * 0.6, eyeRy * 0.9);
            ctx.fill();
            ctx.restore();
        }
        drawEyeliner(-1);
        drawEyeliner(1);

        // ---- Black emo hair: side-swept fringe hanging in his face ----
        // Drawn as a chunky asymmetric shape covering the upper half of the
        // forehead and sweeping down past one eye.
        ctx.fillStyle = cfg.COLOR_HAIR;

        // Skull cap across the top of the head (slightly past the temples)
        ctx.beginPath();
        ctx.moveTo(cx - headRx * 1.05, headCy - headRy * 0.55);
        ctx.bezierCurveTo(
            cx - headRx * 1.15, headCy - headRy * 1.15,
            cx + headRx * 1.15, headCy - headRy * 1.2,
            cx + headRx * 1.05, headCy - headRy * 0.4
        );
        // Sweep down to the left across the forehead
        ctx.bezierCurveTo(
            cx + headRx * 0.55, headCy - headRy * 0.05,
            cx - headRx * 0.2,  headCy + headRy * 0.05,
            cx - headRx * 0.85, headCy - headRy * 0.15
        );
        // Long jagged fringe pointing toward the chin
        ctx.lineTo(cx - headRx * 0.55, headCy + headRy * 0.55);
        ctx.lineTo(cx - headRx * 0.95, headCy + headRy * 0.25);
        ctx.lineTo(cx - headRx * 1.15, headCy + headRy * 0.7);
        ctx.lineTo(cx - headRx * 1.25, headCy - headRy * 0.05);
        ctx.closePath();
        ctx.fill();

        // Subtle purple sheen highlight along the top of the hair
        ctx.strokeStyle = cfg.COLOR_HAIR_HL;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - headRx * 0.9, headCy - headRy * 0.85);
        ctx.bezierCurveTo(
            cx - headRx * 0.4, headCy - headRy * 1.05,
            cx + headRx * 0.5, headCy - headRy * 1.05,
            cx + headRx * 0.95, headCy - headRy * 0.7
        );
        ctx.stroke();

        // Long thin emo bang strand dangling between the eyes
        ctx.strokeStyle = cfg.COLOR_HAIR;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - headRx * 0.05, headCy - headRy * 0.55);
        ctx.quadraticCurveTo(cx - headRx * 0.4, headCy + headRy * 0.1, cx - headRx * 0.15, headCy + headRy * 0.65);
        ctx.stroke();

        ctx.restore();
    };

    // --- Level 3: Greyus Triplets — three saucers orbiting in sync ---
    SpaceBoy.BossRenderers.greyus_triplets = function (ctx, boss, camera) {
        var cfg = boss.cfg;
        var bcx = boss.x + boss.width / 2;
        var bcy = boss.y + boss.height / 2;
        var ts = cfg.TRIPLET_SIZE;
        var hitTint = boss.hitFlash > 0 ? (boss.hitFlash / SpaceBoy.BOSS.HIT_FLASH_TIME) : 0;

        for (var ti = 0; ti < 3; ti++) {
            var tri = boss._triplets[ti];
            var sx = bcx + tri.offsetX - ts.w / 2 - camera.x;
            var sy = bcy + tri.offsetY - ts.h / 2 - camera.y;
            var cx = sx + ts.w / 2;
            var cy = sy + ts.h / 2;
            var w = ts.w;
            var h = ts.h;

            var bob = Math.sin(boss._t * 3 + ti * 1.5) * 2;

            ctx.save();
            ctx.translate(0, bob);

            // --- Saucer body ---
            var saucerCy = sy + h * 0.62;
            var saucerRx = w * 0.5;
            var saucerRy = h * 0.14;

            // Underside glow
            var glowGrad = ctx.createRadialGradient(cx, saucerCy + saucerRy, 2, cx, saucerCy + saucerRy + 20, saucerRx);
            glowGrad.addColorStop(0, 'rgba(255,100,100,0.3)');
            glowGrad.addColorStop(1, 'rgba(255,100,100,0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.ellipse(cx, saucerCy + saucerRy + 10, saucerRx * 1.1, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // Saucer body
            var bodyGrad = ctx.createLinearGradient(cx, saucerCy - saucerRy, cx, saucerCy + saucerRy);
            bodyGrad.addColorStop(0, cfg.COLOR_SAUCER_BODY);
            bodyGrad.addColorStop(0.5, cfg.COLOR_SAUCER_TOP);
            bodyGrad.addColorStop(1, cfg.COLOR_SAUCER_DARK);
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.ellipse(cx, saucerCy, saucerRx, saucerRy, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = cfg.COLOR_SAUCER_RIM;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Rim lights
            var lightCount = 5;
            for (var li = 0; li < lightCount; li++) {
                var lx = cx - saucerRx * 0.8 + (li / (lightCount - 1)) * saucerRx * 1.6;
                var ly = saucerCy + saucerRy * 0.4;
                var blink = 0.4 + 0.6 * Math.abs(Math.sin(boss._t * 6 + li + ti * 2));
                ctx.fillStyle = cfg.COLOR_SAUCER_LIGHT;
                ctx.globalAlpha = blink;
                ctx.beginPath();
                ctx.arc(lx, ly, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // --- Dome ---
            var domeCy = sy + h * 0.44;
            var domeRx = w * 0.32;
            var domeRy = h * 0.24;

            var domeGrad = ctx.createRadialGradient(cx - domeRx * 0.3, domeCy - domeRy * 0.4, 3, cx, domeCy, domeRx);
            domeGrad.addColorStop(0, 'rgba(220,200,200,0.75)');
            domeGrad.addColorStop(0.7, 'rgba(140,120,120,0.45)');
            domeGrad.addColorStop(1, 'rgba(80,60,60,0.55)');
            ctx.fillStyle = domeGrad;
            ctx.beginPath();
            ctx.ellipse(cx, domeCy, domeRx, domeRy, 0, 0, Math.PI * 2);
            ctx.fill();

            // --- Alien head ---
            var headCy = domeCy + domeRy * 0.1;
            var headRx = domeRx * 0.72;
            var headRy = domeRy * 0.85;

            ctx.fillStyle = cfg.COLOR_ALIEN_SKIN;
            ctx.beginPath();
            ctx.moveTo(cx, headCy - headRy);
            ctx.bezierCurveTo(cx + headRx * 1.1, headCy - headRy,
                              cx + headRx,       headCy + headRy * 0.2,
                              cx,                headCy + headRy);
            ctx.bezierCurveTo(cx - headRx,       headCy + headRy * 0.2,
                              cx - headRx * 1.1, headCy - headRy,
                              cx,                headCy - headRy);
            ctx.fill();

            // Eyes
            var eyeRx = headRx * 0.35;
            var eyeRy = headRy * 0.45;
            var eyeSpacing = headRx * 0.42;
            var eyeY = headCy - headRy * 0.05;

            for (var sign = -1; sign <= 1; sign += 2) {
                ctx.save();
                ctx.translate(cx + sign * eyeSpacing, eyeY);
                ctx.rotate(sign * 0.35);
                ctx.fillStyle = cfg.COLOR_ALIEN_EYE;
                ctx.beginPath();
                ctx.ellipse(0, 0, eyeRx, eyeRy, 0, 0, Math.PI * 2);
                ctx.fill();
                // Eye highlight
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 0.85;
                ctx.beginPath();
                ctx.ellipse(-eyeRx * 0.3, -eyeRy * 0.5, eyeRx * 0.18, eyeRy * 0.22, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.restore();
            }

            // Mouth
            ctx.strokeStyle = cfg.COLOR_ALIEN_SKIN_DARK;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - headRx * 0.12, headCy + headRy * 0.55);
            ctx.lineTo(cx + headRx * 0.12, headCy + headRy * 0.55);
            ctx.stroke();

            // Dome rim
            ctx.strokeStyle = cfg.COLOR_SAUCER_RIM;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(cx, domeCy + domeRy, domeRx, domeRy * 0.25, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Dome highlight
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.ellipse(cx - domeRx * 0.4, domeCy - domeRy * 0.5, domeRx * 0.2, domeRy * 0.3, -0.4, 0, Math.PI * 2);
            ctx.fill();

            // Triplet number label
            ctx.fillStyle = cfg.COLOR_SAUCER_LIGHT;
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('#' + (ti + 1), cx, saucerCy + saucerRy + 10);
            ctx.textAlign = 'left';

            // Hit flash
            if (hitTint > 0) {
                ctx.fillStyle = 'rgba(255,255,255,' + (0.6 * hitTint) + ')';
                ctx.beginPath();
                ctx.ellipse(cx, saucerCy, saucerRx, saucerRy, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx, domeCy, domeRx, domeRy, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // --- Connection lines between triplets (sync energy beams) ---
        ctx.save();
        ctx.strokeStyle = cfg.COLOR_SYNC_BEAM;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(boss._t * 8);
        for (var a = 0; a < 3; a++) {
            var b2 = (a + 1) % 3;
            var ax = bcx + boss._triplets[a].offsetX - camera.x;
            var ay = bcy + boss._triplets[a].offsetY - camera.y;
            var bxx = bcx + boss._triplets[b2].offsetX - camera.x;
            var byy = bcy + boss._triplets[b2].offsetY - camera.y;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bxx, byy);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    };

    // =========================================================================
    // Arena helper — computes the boss arena bounds for a given level.
    // Returns a rect in world coordinates.
    // =========================================================================
    function getArenaBounds() {
        var arenaStartPx = LEVEL.PLAY_SCREENS * 30 * SpaceBoy.TILE.SIZE;
        return {
            x: arenaStartPx,
            y: 0,
            width: GAME.CANVAS_WIDTH,      // exactly one camera-width
            height: LEVEL.HEIGHT_PX,
        };
    }

    SpaceBoy.Boss = Boss;
    SpaceBoy.getBossArenaBounds = getArenaBounds;
})();
