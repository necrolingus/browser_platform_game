// =============================================================================
// Space Boy! — Physics / Collision helpers
// =============================================================================

(function () {
    var TILE = SpaceBoy.TILE;

    /**
     * Move entity on X axis, then resolve horizontal collisions.
     */
    function moveX(entity, dt, level) {
        entity.x += entity.vx * dt;

        var leftCol   = Math.floor(entity.x / TILE.SIZE);
        var rightCol  = Math.floor((entity.x + entity.width - 1) / TILE.SIZE);
        var topRow    = Math.floor(entity.y / TILE.SIZE);
        var bottomRow = Math.floor((entity.y + entity.height - 1) / TILE.SIZE);

        for (var r = topRow; r <= bottomRow; r++) {
            if (entity.vx > 0 && level.isSolid(rightCol, r)) {
                entity.x = rightCol * TILE.SIZE - entity.width;
                entity.vx = 0;
                break;
            }
            if (entity.vx < 0 && level.isSolid(leftCol, r)) {
                entity.x = (leftCol + 1) * TILE.SIZE;
                entity.vx = 0;
                break;
            }
        }
    }

    /**
     * Move entity on Y axis, then resolve vertical collisions.
     */
    function moveY(entity, dt, level) {
        entity.y += entity.vy * dt;

        var leftCol   = Math.floor(entity.x / TILE.SIZE);
        var rightCol  = Math.floor((entity.x + entity.width - 1) / TILE.SIZE);
        var topRow    = Math.floor(entity.y / TILE.SIZE);
        var bottomRow = Math.floor((entity.y + entity.height - 1) / TILE.SIZE);

        entity.onGround = false;

        for (var c = leftCol; c <= rightCol; c++) {
            if (entity.vy >= 0 && level.isSolid(c, bottomRow)) {
                entity.y = bottomRow * TILE.SIZE - entity.height;
                entity.vy = 0;
                entity.onGround = true;
                break;
            }
            if (entity.vy < 0 && level.isSolid(c, topRow)) {
                entity.y = (topRow + 1) * TILE.SIZE;
                entity.vy = 0;
                break;
            }
        }

        // Ground probe: if not already on ground, check 1px below feet
        // This prevents onGround from flickering when resting on a surface
        if (!entity.onGround && entity.vy >= 0) {
            var probeRow = Math.floor((entity.y + entity.height + 1) / TILE.SIZE);
            for (var c = leftCol; c <= rightCol; c++) {
                if (level.isSolid(c, probeRow)) {
                    entity.onGround = true;
                    break;
                }
            }
        }
    }

    /** Check if entity is standing on or touching lava */
    function checkLava(entity, level) {
        var leftCol  = Math.floor(entity.x / TILE.SIZE);
        var rightCol = Math.floor((entity.x + entity.width - 1) / TILE.SIZE);
        var bottomRow = Math.floor((entity.y + entity.height + 1) / TILE.SIZE);

        for (var c = leftCol; c <= rightCol; c++) {
            if (level.isLava(c, bottomRow)) return true;
        }
        return false;
    }

    /** Simple AABB overlap test */
    function aabb(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    /** Circle-vs-AABB overlap (for bullets) */
    function circleRect(cx, cy, cr, rx, ry, rw, rh) {
        var nearX = Math.max(rx, Math.min(cx, rx + rw));
        var nearY = Math.max(ry, Math.min(cy, ry + rh));
        var dx = cx - nearX;
        var dy = cy - nearY;
        return dx * dx + dy * dy <= cr * cr;
    }

    SpaceBoy.moveX = moveX;
    SpaceBoy.moveY = moveY;
    SpaceBoy.checkLava = checkLava;
    SpaceBoy.aabb = aabb;
    SpaceBoy.circleRect = circleRect;
})();
