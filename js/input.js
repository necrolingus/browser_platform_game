// =============================================================================
// Space Boy! — Input Handler
// Tracks keyboard and mouse state each frame.
// =============================================================================

(function () {
    // Map physical key codes to game action names
    var CODE_TO_KEY = {
        'KeyA': 'a',
        'KeyD': 'd',
        'KeyW': 'w',
        'KeyS': 's',
        'Space': ' '
    };

    class Input {
        constructor(canvas) {
            this.canvas = canvas;
            this.keys = {};
            this.mouseX = 0;
            this.mouseY = 0;
            this.lmbDown = false;
            this.rmbDown = false;
            this.lmbPressed = false;
            this.rmbPressed = false;
            this.spacePressed = false;

            // Mouse wheel: +1 for wheel-down, -1 for wheel-up (single-tick per frame)
            this.wheelDelta = 0;
            this._wheelAccumulated = 0;

            this._lmbJustPressed = false;
            this._rmbJustPressed = false;
            this._spaceJustPressed = false;

            // Make canvas focusable
            canvas.setAttribute('tabindex', '0');
            canvas.style.outline = 'none';

            var self = this;

            // Use e.code for physical key position (layout-independent)
            document.addEventListener('keydown', function (e) {
                var mapped = CODE_TO_KEY[e.code];
                if (mapped) {
                    self.keys[mapped] = true;
                    if (e.code === 'Space') self._spaceJustPressed = true;
                    e.preventDefault();
                }
            });

            document.addEventListener('keyup', function (e) {
                var mapped = CODE_TO_KEY[e.code];
                if (mapped) {
                    self.keys[mapped] = false;
                }
            });

            // Clear all keys when window loses focus
            window.addEventListener('blur', function () {
                self.keys = {};
            });

            canvas.addEventListener('mousemove', function (e) {
                var rect = canvas.getBoundingClientRect();
                // Canvas is CSS-scaled to fit the viewport but its internal
                // resolution is fixed. Convert client coords to canvas coords.
                var scaleX = canvas.width / rect.width;
                var scaleY = canvas.height / rect.height;
                self.mouseX = (e.clientX - rect.left) * scaleX;
                self.mouseY = (e.clientY - rect.top) * scaleY;
            });

            canvas.addEventListener('mousedown', function (e) {
                if (e.button === 0) { self.lmbDown = true; self._lmbJustPressed = true; }
                if (e.button === 2) { self.rmbDown = true; self._rmbJustPressed = true; }
            });

            canvas.addEventListener('mouseup', function (e) {
                if (e.button === 0) self.lmbDown = false;
                if (e.button === 2) self.rmbDown = false;
            });

            canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

            // Mouse wheel — used to cycle weapons. Accumulate deltaY between
            // frames; update() emits a single -1/0/+1 tick per frame.
            canvas.addEventListener('wheel', function (e) {
                self._wheelAccumulated += e.deltaY;
                e.preventDefault();
            }, { passive: false });
        }

        update() {
            this.lmbPressed = this._lmbJustPressed;
            this.rmbPressed = this._rmbJustPressed;
            this.spacePressed = this._spaceJustPressed;
            this._lmbJustPressed = false;
            this._rmbJustPressed = false;
            this._spaceJustPressed = false;

            // Convert accumulated wheel delta to discrete -1/0/+1 per frame
            if (this._wheelAccumulated > 5) {
                this.wheelDelta = 1;
                this._wheelAccumulated = 0;
            } else if (this._wheelAccumulated < -5) {
                this.wheelDelta = -1;
                this._wheelAccumulated = 0;
            } else {
                this.wheelDelta = 0;
            }
        }

        isKeyDown(key) {
            return !!this.keys[key];
        }
    }

    SpaceBoy.Input = Input;
})();
