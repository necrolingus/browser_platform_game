// =============================================================================
// Space Boy! — HUD (heads-up display)
// Hearts, charge bar, super bullets above player.
// Score, gems, kill stats in top-left corner.
// =============================================================================

(function () {
    var HUD = SpaceBoy.HUD;
    var PLAYER = SpaceBoy.PLAYER;
    var GEM = SpaceBoy.GEM;
    var SUPER = SpaceBoy.SUPER_BULLET;
    var TYPES = SpaceBoy.ENEMY_TYPES;

    function drawHeart(ctx, x, y, size) {
        var s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x + s, y + size * 0.8);
        ctx.bezierCurveTo(x, y + size * 0.5, x, y, x + s, y + s * 0.4);
        ctx.bezierCurveTo(x + size, y, x + size, y + size * 0.5, x + s, y + size * 0.8);
        ctx.fill();
    }

    function drawHUD(ctx, player, camera, score, gemsCollected, killTracker) {
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
    }

    SpaceBoy.drawHUD = drawHUD;
})();
