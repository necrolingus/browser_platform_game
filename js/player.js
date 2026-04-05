// =============================================================================
// Space Boy! — Player (Space Blob with oversized gun)
// All rendering is canvas-drawn. Physics uses only WIDTH/HEIGHT for hitbox.
// =============================================================================

(function () {
    var PLAYER = SpaceBoy.PLAYER;
    var PHYSICS = SpaceBoy.PHYSICS;
    var BULLET = SpaceBoy.BULLET;
    var SUPER = SpaceBoy.SUPER_BULLET;
    var BLOB = PLAYER.BLOB;
    var GUN = PLAYER.GUN;

    class Player {
        constructor(x, y) {
            this.spawnX = x;
            this.spawnY = y;
            this.x = x;
            this.y = y;
            this.width = PLAYER.WIDTH;      // hitbox only
            this.height = PLAYER.HEIGHT;    // hitbox only
            this.vx = 0;
            this.vy = 0;
            this.onGround = false;
            this.facingRight = true;
            this.health = PLAYER.MAX_HEALTH;
            this.invTimer = 0;
            this.alive = true;
            this.gunAngle = 0;
            this.fireCooldown = 0;

            // Jump tracking
            this.jumpsUsed = 0;

            // Super bullet state
            this.killCharge = 0;        // kills toward next super bullet (0 to KILLS_TO_CHARGE)
            this.superBullets = 0;      // available super bullets
            this.superFireCooldown = 0;

            // Visual-only animation state (never affects physics)
            this.blobTime = 0;
            this.muzzleFlash = 0;
        }

        update(dt, input, camera, bullets) {
            if (!this.alive) return;

            // --- Invincibility timer ---
            if (this.invTimer > 0) this.invTimer -= dt;

            // --- Animation timer (visual only) ---
            this.blobTime += dt;
            if (this.muzzleFlash > 0) this.muzzleFlash -= dt;

            // --- Horizontal movement ---
            var accel = this.onGround ? 1 : PLAYER.AIR_CONTROL;
            var moveDir = 0;
            if (input.isKeyDown('a')) moveDir -= 1;
            if (input.isKeyDown('d')) moveDir += 1;

            this.vx = moveDir * PLAYER.SPEED * accel;

            // Update facing direction based on movement
            if (moveDir > 0) this.facingRight = true;
            else if (moveDir < 0) this.facingRight = false;

            // Reset jump counter when on ground
            if (this.onGround) {
                this.jumpsUsed = 0;
            }

            // --- Jumping (RMB) — supports double jump ---
            if (input.rmbPressed && this.jumpsUsed < PLAYER.MAX_JUMPS) {
                var isDoubleJump = this.jumpsUsed > 0;
                this.vy = isDoubleJump ? PLAYER.DOUBLE_JUMP_VELOCITY : PLAYER.JUMP_VELOCITY;
                if (moveDir !== 0) {
                    this.vx += moveDir * PLAYER.LEAP_VELOCITY_X;
                }
                this.onGround = false;
                this.jumpsUsed++;
            }

            // --- Gravity ---
            this.vy += PHYSICS.GRAVITY * dt;
            if (this.vy > PHYSICS.TERMINAL_VELOCITY) this.vy = PHYSICS.TERMINAL_VELOCITY;

            // --- Gun angle (toward mouse in world space) ---
            var centerX = this.x + this.width / 2 - camera.x;
            var centerY = this.y + this.height / 2 - camera.y;
            this.gunAngle = Math.atan2(input.mouseY - centerY, input.mouseX - centerX);

            // --- Shooting (LMB) — normal bullets ---
            this.fireCooldown -= dt;
            if (input.lmbDown && this.fireCooldown <= 0) {
                this.fireCooldown = BULLET.FIRE_RATE;
                this.muzzleFlash = GUN.MUZZLE_FLASH_TIME;
                var bx = this.x + this.width / 2 + Math.cos(this.gunAngle) * PLAYER.GUN_LENGTH;
                var by = this.y + this.height / 2 + Math.sin(this.gunAngle) * PLAYER.GUN_LENGTH;
                bullets.push({
                    x: bx,
                    y: by,
                    vx: Math.cos(this.gunAngle) * BULLET.SPEED,
                    vy: Math.sin(this.gunAngle) * BULLET.SPEED,
                    life: BULLET.MAX_LIFETIME,
                    damage: BULLET.DAMAGE,
                    isSuper: false,
                });
            }

            // --- Super bullet (Spacebar) ---
            this.superFireCooldown -= dt;
            if (input.spacePressed && this.superBullets > 0 && this.superFireCooldown <= 0) {
                this.superBullets--;
                this.superFireCooldown = SUPER.FIRE_RATE;
                this.muzzleFlash = GUN.MUZZLE_FLASH_TIME * 2;
                var sbx = this.x + this.width / 2 + Math.cos(this.gunAngle) * PLAYER.GUN_LENGTH;
                var sby = this.y + this.height / 2 + Math.sin(this.gunAngle) * PLAYER.GUN_LENGTH;
                bullets.push({
                    x: sbx,
                    y: sby,
                    vx: Math.cos(this.gunAngle) * SUPER.SPEED,
                    vy: Math.sin(this.gunAngle) * SUPER.SPEED,
                    life: SUPER.MAX_LIFETIME,
                    damage: SUPER.DAMAGE,
                    isSuper: true,
                });
            }

            // Position is applied axis-by-axis in main loop for proper collision
        }

        takeDamage() {
            if (this.invTimer > 0) return;
            this.health--;
            if (this.health <= 0) {
                this.alive = false;
            } else {
                this.invTimer = PLAYER.INVINCIBILITY_TIME;
            }
        }

        kill() {
            this.health = 0;
            this.alive = false;
        }

        addKill() {
            this.killCharge++;
            if (this.killCharge >= SUPER.KILLS_TO_CHARGE) {
                this.killCharge = 0;
                this.superBullets++;
            }
        }

        reset() {
            this.x = this.spawnX;
            this.y = this.spawnY;
            this.vx = 0;
            this.vy = 0;
            this.health = PLAYER.MAX_HEALTH;
            this.invTimer = 0;
            this.alive = true;
            this.onGround = false;
            this.fireCooldown = 0;
            this.jumpsUsed = 0;
            this.killCharge = 0;
            this.superBullets = 0;
            this.superFireCooldown = 0;
            this.blobTime = 0;
            this.muzzleFlash = 0;
        }

        draw(ctx, camera) {
            if (!this.alive) return;

            // Blink when invincible
            if (this.invTimer > 0 && Math.floor(this.invTimer * 10) % 2 === 0) return;

            var sx = this.x - camera.x;
            var sy = this.y - camera.y;

            // Center of hitbox (all visual drawing is relative to this)
            var cx = sx + this.width / 2;
            var cy = sy + this.height / 2;

            // --- Determine blob stretch/squash ---
            var isMoving = Math.abs(this.vx) > 10;
            var stretchX = 1;
            var stretchY = 1;

            if (!this.onGround) {
                // Airborne: tall and narrow
                stretchX = BLOB.JUMP_SQUASH_X;
                stretchY = BLOB.JUMP_STRETCH_Y;
            } else if (isMoving) {
                // Running: wide and short
                stretchX = BLOB.MOVE_STRETCH_X;
                stretchY = BLOB.MOVE_SQUASH_Y;
            }

            var rx = BLOB.RADIUS_X * stretchX;
            var ry = BLOB.RADIUS_Y * stretchY;

            // Shift blob down so feet stay at bottom of hitbox
            var blobCY = sy + this.height - ry;

            // --- Draw order: back arm → blob body → gun arm → gun → eyes ---
            this._drawArm(ctx, cx, blobCY, false);   // back arm (no gun)
            this._drawBlob(ctx, cx, blobCY, rx, ry);
            this._drawArm(ctx, cx, blobCY, true);    // gun arm
            this._drawGun(ctx, cx, blobCY);
            this._drawEyes(ctx, cx, blobCY);
        }

        _drawBlob(ctx, cx, cy, rx, ry) {
            var t = this.blobTime;
            var n = BLOB.WOBBLE_POINTS;

            ctx.save();

            // Build wobbling blob path using control points
            ctx.beginPath();
            for (var i = 0; i <= n; i++) {
                var angle = (i / n) * Math.PI * 2;
                // Each point wobbles independently using offset sine waves
                var wobble = Math.sin(t * BLOB.WOBBLE_SPEED + i * 1.7) * BLOB.WOBBLE_AMP;
                var px = cx + Math.cos(angle) * (rx + wobble);
                var py = cy + Math.sin(angle) * (ry + wobble * 0.7);

                if (i === 0) {
                    ctx.moveTo(px, py);
                } else {
                    // Smooth curve through points
                    var prevAngle = ((i - 1) / n) * Math.PI * 2;
                    var prevWobble = Math.sin(t * BLOB.WOBBLE_SPEED + (i - 1) * 1.7) * BLOB.WOBBLE_AMP;
                    var prevX = cx + Math.cos(prevAngle) * (rx + prevWobble);
                    var prevY = cy + Math.sin(prevAngle) * (ry + prevWobble * 0.7);
                    var midX = (prevX + px) / 2;
                    var midY = (prevY + py) / 2;
                    ctx.quadraticCurveTo(prevX, prevY, midX, midY);
                }
            }
            ctx.closePath();

            // Gradient fill for depth
            var grad = ctx.createRadialGradient(cx - 3, cy - 4, 2, cx, cy, Math.max(rx, ry));
            grad.addColorStop(0, BLOB.COLOR_LIGHT);
            grad.addColorStop(0.4, BLOB.COLOR);
            grad.addColorStop(1, BLOB.COLOR_DARK);
            ctx.fillStyle = grad;
            ctx.fill();

            // Outline
            ctx.strokeStyle = BLOB.COLOR_DARK;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.restore();
        }

        _drawEyes(ctx, cx, cy) {
            var eyeOffX = BLOB.EYE_OFFSET_X;
            var eyeOffY = BLOB.EYE_OFFSET_Y;

            // Flip eyes based on facing direction
            var leftEyeX = this.facingRight ? cx - eyeOffX : cx + eyeOffX;
            var rightEyeX = this.facingRight ? cx + eyeOffX : cx - eyeOffX;
            var eyeY = cy + eyeOffY;

            // Pupils track gun angle slightly
            var pupilShiftX = Math.cos(this.gunAngle) * 1.5;
            var pupilShiftY = Math.sin(this.gunAngle) * 1.5;

            // Left eye
            ctx.fillStyle = BLOB.EYE_COLOR;
            ctx.beginPath();
            ctx.arc(leftEyeX, eyeY, BLOB.EYE_SIZE, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = BLOB.PUPIL_COLOR;
            ctx.beginPath();
            ctx.arc(leftEyeX + pupilShiftX, eyeY + pupilShiftY, BLOB.PUPIL_SIZE, 0, Math.PI * 2);
            ctx.fill();

            // Right eye
            ctx.fillStyle = BLOB.EYE_COLOR;
            ctx.beginPath();
            ctx.arc(rightEyeX, eyeY, BLOB.EYE_SIZE, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = BLOB.PUPIL_COLOR;
            ctx.beginPath();
            ctx.arc(rightEyeX + pupilShiftX, eyeY + pupilShiftY, BLOB.PUPIL_SIZE, 0, Math.PI * 2);
            ctx.fill();
        }

        _drawArm(ctx, cx, cy, isGunArm) {
            ctx.save();

            var t = this.blobTime;
            var armAngle;
            var side;

            if (isGunArm) {
                // Gun arm follows gun angle
                armAngle = this.gunAngle;
                side = 1;
            } else {
                // Back arm: flexed outward to the side, not dangling down
                var swing = Math.sin(t * BLOB.ARM_WOBBLE_SPEED) * 0.2;
                // Point arm out to the back side (opposite facing direction)
                var baseAngle = this.facingRight ? Math.PI + 0.4 : -0.4;
                armAngle = baseAngle + swing;
                side = -1;
            }

            // Arm attachment point on the blob surface
            var attachX = cx + Math.cos(armAngle) * (BLOB.RADIUS_X * 0.6);
            var attachY = cy + BLOB.ARM_OFFSET_Y;

            // Wobble the arm thickness for globby effect
            var wobble = Math.sin(t * BLOB.ARM_WOBBLE_SPEED + (isGunArm ? 0 : 2)) * BLOB.ARM_WOBBLE_AMP;

            ctx.translate(attachX, attachY);
            ctx.rotate(armAngle);

            // Flip vertically when aiming left (same logic as gun)
            var flip = (armAngle > Math.PI / 2 || armAngle < -Math.PI / 2);
            if (isGunArm && flip) {
                ctx.scale(1, -1);
            }

            // Upper arm (bicep) — drawn as a thick rounded shape
            var bicepW = BLOB.ARM_WIDTH + BLOB.BICEP_BULGE + wobble;
            ctx.fillStyle = BLOB.ARM_COLOR;
            ctx.beginPath();
            ctx.ellipse(BLOB.ARM_LENGTH / 2, 0, BLOB.ARM_LENGTH / 2, bicepW / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Bicep highlight
            ctx.fillStyle = BLOB.ARM_COLOR_DARK;
            ctx.beginPath();
            ctx.ellipse(BLOB.ARM_LENGTH / 2, bicepW / 4, BLOB.ARM_LENGTH / 3, bicepW / 4, 0, 0, Math.PI);
            ctx.fill();

            // Forearm — slightly thinner
            var forearmW = BLOB.FOREARM_WIDTH + wobble * 0.5;
            ctx.fillStyle = BLOB.ARM_COLOR;
            ctx.beginPath();
            ctx.ellipse(BLOB.ARM_LENGTH + BLOB.FOREARM_LENGTH / 2, 0, BLOB.FOREARM_LENGTH / 2, forearmW / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        _drawGun(ctx, cx, cy) {
            ctx.save();

            // Rotate around blob center
            ctx.translate(cx, cy);
            ctx.rotate(this.gunAngle);

            // Flip gun vertically when aiming left so it doesn't draw upside-down
            var flip = (this.gunAngle > Math.PI / 2 || this.gunAngle < -Math.PI / 2);
            if (flip) {
                ctx.scale(1, -1);
            }

            // Gun body (comically large rectangle)
            ctx.fillStyle = GUN.COLOR_BODY;
            ctx.fillRect(0, -GUN.BODY_WIDTH / 2, GUN.BODY_LENGTH, GUN.BODY_WIDTH);

            // Barrel (extends past body)
            ctx.fillStyle = GUN.COLOR_BARREL;
            ctx.fillRect(GUN.BODY_LENGTH, -GUN.BARREL_WIDTH / 2, GUN.BARREL_LENGTH, GUN.BARREL_WIDTH);

            // Detail line on body
            ctx.fillStyle = GUN.COLOR_DETAIL;
            ctx.fillRect(4, -GUN.BODY_WIDTH / 2 + 1, GUN.BODY_LENGTH - 8, 2);

            // Grip (hangs below)
            ctx.fillStyle = GUN.COLOR_GRIP;
            ctx.fillRect(4, GUN.BODY_WIDTH / 2 - 1, GUN.GRIP_WIDTH, GUN.GRIP_LENGTH);

            // Muzzle flash
            if (this.muzzleFlash > 0) {
                var muzzleX = GUN.BODY_LENGTH + GUN.BARREL_LENGTH;
                ctx.fillStyle = GUN.COLOR_MUZZLE;
                ctx.globalAlpha = this.muzzleFlash / GUN.MUZZLE_FLASH_TIME;
                ctx.beginPath();
                ctx.arc(muzzleX + 4, 0, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            ctx.restore();
        }
    }

    SpaceBoy.Player = Player;
})();
