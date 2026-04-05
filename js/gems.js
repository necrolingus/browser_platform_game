// =============================================================================
// Space Boy! — Space Gems
// =============================================================================

(function () {
    var GEM = SpaceBoy.GEM;

    class SpaceGem {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = GEM.SIZE;
            this.collected = false;
            this.time = Math.random() * Math.PI * 2;
        }

        update(dt) {
            this.time += dt;
        }

        draw(ctx, camera) {
            if (this.collected) return;

            var sx = this.x - camera.x;
            var sy = this.y - camera.y;
            var bob = Math.sin(this.time * 3) * 3;

            // Glow
            ctx.fillStyle = GEM.GLOW_COLOR;
            ctx.beginPath();
            ctx.arc(sx + this.size / 2, sy + this.size / 2 + bob, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Gem (diamond shape)
            ctx.fillStyle = GEM.COLOR;
            ctx.beginPath();
            var cx = sx + this.size / 2;
            var cy = sy + this.size / 2 + bob;
            var hs = this.size / 2;
            ctx.moveTo(cx, cy - hs);
            ctx.lineTo(cx + hs, cy);
            ctx.lineTo(cx, cy + hs);
            ctx.lineTo(cx - hs, cy);
            ctx.closePath();
            ctx.fill();
        }
    }

    SpaceBoy.SpaceGem = SpaceGem;
})();
