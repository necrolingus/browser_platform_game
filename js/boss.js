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
            var cx = this.x + this.width / 2;
            var cy = this.y + this.height / 2;
            for (var i = 0; i < BOSS.DEATH_PARTICLE_COUNT; i++) {
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

        /** True rect used for hit testing & collisions */
        rect() {
            return { x: this.x, y: this.y, width: this.width, height: this.height };
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
            var bx = this.x + this.width / 2;
            var by = this.y + this.height * 0.65; // fire from saucer underside
            var px = player.x + player.width / 2;
            var py = player.y + player.height / 2;
            var angle = Math.atan2(py - by, px - bx);
            // Add random spread
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

        /** Test if a boss bullet hit the player (returns index hit, or -1) */
        checkBulletHitsPlayer(player) {
            for (var i = this.bullets.length - 1; i >= 0; i--) {
                var b = this.bullets[i];
                if (b.x + b.radius > player.x &&
                    b.x - b.radius < player.x + player.width &&
                    b.y + b.radius > player.y &&
                    b.y - b.radius < player.y + player.height) {
                    this.bullets.splice(i, 1);
                    return true;
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
