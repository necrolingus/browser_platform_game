// =============================================================================
// Space Boy! — Camera
// Follows the player horizontally with a dead zone. Clamped to level bounds.
// =============================================================================

(function () {
    var GAME = SpaceBoy.GAME;
    var LEVEL = SpaceBoy.LEVEL;
    var CAMERA = SpaceBoy.CAMERA;

    class Camera {
        constructor() {
            this.x = 0;
            this.y = 0;
        }

        follow(player) {
            var screenCenterX = this.x + GAME.CANVAS_WIDTH / 2;
            var dx = player.x + player.width / 2 - screenCenterX;

            if (Math.abs(dx) > CAMERA.DEAD_ZONE_X) {
                this.x += dx - Math.sign(dx) * CAMERA.DEAD_ZONE_X;
            }

            // Clamp to level boundaries
            this.x = Math.max(0, Math.min(this.x, LEVEL.WIDTH_PX - GAME.CANVAS_WIDTH));
            this.y = 0; // no vertical scrolling for now
        }

        reset() {
            this.x = 0;
            this.y = 0;
        }
    }

    SpaceBoy.Camera = Camera;
})();
