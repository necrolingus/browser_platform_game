// =============================================================================
// Space Boy! — HUD (heads-up display)
// Hearts, charge bar, super bullets above player.
// Score, gems, kill stats in top-left corner.
// =============================================================================

(function () {
    var HUD = SpaceBoy.HUD;
    var GAME = SpaceBoy.GAME;
    var PLAYER = SpaceBoy.PLAYER;
    var GEM = SpaceBoy.GEM;
    var SUPER = SpaceBoy.SUPER_BULLET;
    var MEGA = SpaceBoy.MEGA_BULLET;
    var WEAPONS = SpaceBoy.WEAPONS;
    var TYPES = SpaceBoy.ENEMY_TYPES;

    function drawHeart(ctx, x, y, size) {
        var s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x + s, y + size * 0.8);
        ctx.bezierCurveTo(x, y + size * 0.5, x, y, x + s, y + s * 0.4);
        ctx.bezierCurveTo(x + size, y, x + size, y + size * 0.5, x + s, y + size * 0.8);
        ctx.fill();
    }

    // --- Main Menu button bounds (cached for hit-testing) ---
    var menuBtnRect = {
        x: GAME.CANVAS_WIDTH - HUD.MENU_BTN_WIDTH - HUD.MENU_BTN_MARGIN,
        y: HUD.MENU_BTN_MARGIN,
        w: HUD.MENU_BTN_WIDTH,
        h: HUD.MENU_BTN_HEIGHT,
    };

    function drawHUD(ctx, player, camera, score, gemsCollected, killTracker, mouseX, mouseY) {
        // =====================================================================
        // Above-player indicators
        // =====================================================================
        if (player.alive) {
            var px = player.x - camera.x;
            var py = player.y - camera.y;
            var centerX = px + player.width / 2;

            // --- Hearts ---
            var totalWidth = PLAYER.MAX_HEALTH * HUD.HEART_SPACING;
            var startX = centerX - totalWidth / 2;
            var heartY = py + HUD.HEART_OFFSET_Y;

            for (var i = 0; i < PLAYER.MAX_HEALTH; i++) {
                var hx = startX + i * HUD.HEART_SPACING;
                ctx.fillStyle = i < player.health ? HUD.HEART_COLOR : HUD.HEART_EMPTY_COLOR;
                drawHeart(ctx, hx, heartY, HUD.HEART_SIZE);
            }

            // --- Charge bar (fills up toward next super bullet) ---
            var barW = HUD.CHARGE_BAR_WIDTH;
            var barH = HUD.CHARGE_BAR_HEIGHT;
            var barX = centerX - barW / 2;
            var barY = py + HUD.CHARGE_BAR_OFFSET_Y;
            var chargeRatio = player.killCharge / SUPER.KILLS_TO_CHARGE;

            // Background
            ctx.fillStyle = HUD.CHARGE_BAR_BG;
            ctx.fillRect(barX, barY, barW, barH);

            // Fill
            ctx.fillStyle = chargeRatio >= 1 ? HUD.CHARGE_BAR_FULL : HUD.CHARGE_BAR_FILL;
            ctx.fillRect(barX, barY, barW * chargeRatio, barH);

            // Border
            ctx.strokeStyle = HUD.CHARGE_BAR_FILL;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(barX, barY, barW, barH);

            // --- Super bullet count (icons above charge bar) ---
            if (player.superBullets > 0) {
                var iconY = py + HUD.SUPER_ICON_OFFSET_Y;
                var totalIconW = player.superBullets * HUD.SUPER_ICON_SPACING;
                var iconStartX = centerX - totalIconW / 2 + HUD.SUPER_ICON_SPACING / 2;

                for (var i = 0; i < player.superBullets; i++) {
                    var ix = iconStartX + i * HUD.SUPER_ICON_SPACING;
                    // Glowing orb
                    ctx.fillStyle = 'rgba(0,255,255,0.3)';
                    ctx.beginPath();
                    ctx.arc(ix, iconY, HUD.SUPER_ICON_SIZE * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = HUD.SUPER_ICON_COLOR;
                    ctx.beginPath();
                    ctx.arc(ix, iconY, HUD.SUPER_ICON_SIZE, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // --- Mega bullet count (icons above super bullet row) ---
            if (player.megaBullets > 0) {
                var megaY = py + HUD.SUPER_ICON_OFFSET_Y - 12;
                var totalMegaW = player.megaBullets * (HUD.SUPER_ICON_SPACING + 2);
                var megaStartX = centerX - totalMegaW / 2 + (HUD.SUPER_ICON_SPACING + 2) / 2;

                for (var i = 0; i < player.megaBullets; i++) {
                    var ix = megaStartX + i * (HUD.SUPER_ICON_SPACING + 2);
                    // Magenta glow orb
                    ctx.fillStyle = MEGA.GLOW_COLOR;
                    ctx.beginPath();
                    ctx.arc(ix, megaY, HUD.SUPER_ICON_SIZE * 1.8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = MEGA.COLOR;
                    ctx.beginPath();
                    ctx.arc(ix, megaY, HUD.SUPER_ICON_SIZE * 1.2, 0, Math.PI * 2);
                    ctx.fill();
                    // White hot core
                    ctx.fillStyle = MEGA.CORE_COLOR;
                    ctx.beginPath();
                    ctx.arc(ix, megaY, HUD.SUPER_ICON_SIZE * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // --- Current weapon indicator (only if player has >1 weapon) ---
            if (player.availableWeapons && player.availableWeapons.length > 1) {
                var labelY = py + HUD.SUPER_ICON_OFFSET_Y - 26;
                var label = player.currentWeapon === WEAPONS.MEGA ? 'MEGA' : 'NORMAL';
                var color = player.currentWeapon === WEAPONS.MEGA ? MEGA.COLOR : '#ffcc00';
                ctx.font = HUD.FONT_SMALL;
                ctx.textAlign = 'center';
                ctx.fillStyle = color;
                ctx.fillText(label, centerX, labelY);
                ctx.textAlign = 'start';
            }
        }

        // =====================================================================
        // Top-left corner HUD
        // =====================================================================

        // --- Score ---
        ctx.fillStyle = HUD.TEXT_COLOR;
        ctx.font = HUD.FONT;
        ctx.fillText('Score: ' + score, HUD.SCORE_X, HUD.SCORE_Y);

        // --- Gems ---
        ctx.fillStyle = GEM.COLOR;
        var gx = HUD.GEM_X;
        var gy = HUD.GEM_Y - 5;
        ctx.beginPath();
        ctx.moveTo(gx + 5, gy);
        ctx.lineTo(gx + 10, gy + 5);
        ctx.lineTo(gx + 5, gy + 10);
        ctx.lineTo(gx, gy + 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = HUD.TEXT_COLOR;
        ctx.fillText('\u00d7 ' + gemsCollected, gx + 14, HUD.GEM_Y + 4);

        // --- Kill stats per enemy type ---
        if (killTracker) {
            ctx.font = HUD.FONT_SMALL;
            var ky = HUD.KILLS_Y;
            for (var typeName in killTracker) {
                if (!killTracker.hasOwnProperty(typeName)) continue;
                var cfg = TYPES[typeName];
                if (!cfg) continue;

                // Small colored dot
                ctx.fillStyle = cfg.COLOR;
                ctx.beginPath();
                ctx.arc(HUD.SCORE_X + 5, ky - 3, 4, 0, Math.PI * 2);
                ctx.fill();

                // Kill count text
                ctx.fillStyle = HUD.TEXT_COLOR;
                ctx.fillText(typeName + ': ' + killTracker[typeName], HUD.SCORE_X + 14, ky);
                ky += 16;
            }
        }

        // =====================================================================
        // Main Menu button (top-right corner)
        // =====================================================================
        var bx = menuBtnRect.x;
        var by = menuBtnRect.y;
        var bw = menuBtnRect.w;
        var bh = menuBtnRect.h;
        var hover = (mouseX >= bx && mouseX <= bx + bw && mouseY >= by && mouseY <= by + bh);

        ctx.fillStyle = hover ? HUD.MENU_BTN_HOVER_BG : HUD.MENU_BTN_BG;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = HUD.MENU_BTN_BORDER;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.font = HUD.MENU_BTN_FONT;
        ctx.textAlign = 'center';
        ctx.fillStyle = hover ? HUD.MENU_BTN_HOVER_TEXT : HUD.MENU_BTN_TEXT;
        ctx.fillText('Menu', bx + bw / 2, by + bh / 2 + 4);
        ctx.textAlign = 'start';
    }

    function isMenuButtonHit(canvasX, canvasY) {
        return canvasX >= menuBtnRect.x && canvasX <= menuBtnRect.x + menuBtnRect.w &&
               canvasY >= menuBtnRect.y && canvasY <= menuBtnRect.y + menuBtnRect.h;
    }

    SpaceBoy.drawHUD = drawHUD;
    SpaceBoy.isMenuButtonHit = isMenuButtonHit;
})();
