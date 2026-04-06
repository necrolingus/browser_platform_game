// =============================================================================
// Space Boy! — Space Background
// Procedurally generated starfield, nebulae, and distant planets.
// Adapts to level size. Uses parallax scrolling.
// =============================================================================

(function () {
    var BG = SpaceBoy.BACKGROUND;
    var GAME = SpaceBoy.GAME;
    var LEVEL = SpaceBoy.LEVEL;

    // Seeded random for deterministic generation
    function srand(seed) {
        var n = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return n - Math.floor(n);
    }

    var stars = [];
    var nebulae = [];
    var planets = [];

    function generate() {
        stars.length = 0;
        nebulae.length = 0;
        planets.length = 0;

        var bgWidth = LEVEL.WIDTH_PX;
        var bgHeight = GAME.CANVAS_HEIGHT;
        var area = bgWidth * bgHeight;

        // --- Stars ---
        var starCount = Math.floor(area * BG.STAR_DENSITY);
        for (var i = 0; i < starCount; i++) {
            stars.push({
                x: srand(i * 3 + 1) * bgWidth,
                y: srand(i * 3 + 2) * bgHeight,
                size: BG.STAR_MIN_SIZE + srand(i * 3 + 3) * (BG.STAR_MAX_SIZE - BG.STAR_MIN_SIZE),
                color: BG.STAR_COLORS[Math.floor(srand(i * 7 + 5) * BG.STAR_COLORS.length)],
                twinkleOffset: srand(i * 11 + 7) * Math.PI * 2,
            });
        }

        // --- Nebulae (scale count with level width) ---
        var nebulaCount = Math.max(1, Math.round(BG.NEBULA_COUNT * (LEVEL.SCREENS / 4)));
        for (var i = 0; i < nebulaCount; i++) {
            nebulae.push({
                x: srand(i * 5 + 100) * bgWidth,
                y: srand(i * 5 + 101) * bgHeight * 0.7,
                radius: BG.NEBULA_MIN_RADIUS + srand(i * 5 + 102) * (BG.NEBULA_MAX_RADIUS - BG.NEBULA_MIN_RADIUS),
                color: BG.NEBULA_COLORS[i % BG.NEBULA_COLORS.length],
            });
        }

        // --- Distant planets ---
        var planetCount = Math.max(1, Math.round(BG.PLANET_COUNT * (LEVEL.SCREENS / 4)));
        for (var i = 0; i < planetCount; i++) {
            var r = BG.PLANET_MIN_RADIUS + srand(i * 9 + 200) * (BG.PLANET_MAX_RADIUS - BG.PLANET_MIN_RADIUS);
            planets.push({
                x: srand(i * 9 + 201) * bgWidth,
                y: r + srand(i * 9 + 202) * (bgHeight * 0.5),
                radius: r,
                color: BG.PLANET_COLORS[i % BG.PLANET_COLORS.length],
                ringChance: srand(i * 9 + 203),
            });
        }
    }

    function draw(ctx, camera) {
        var cw = GAME.CANVAS_WIDTH;
        var ch = GAME.CANVAS_HEIGHT;

        // --- Nebulae (furthest back) ---
        for (var i = 0; i < nebulae.length; i++) {
            var n = nebulae[i];
            var nx = n.x - camera.x * BG.PARALLAX_NEBULA;
            var ny = n.y;

            // Wrap horizontally
            nx = ((nx % cw) + cw) % cw;

            var grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.radius);
            grad.addColorStop(0, n.color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(nx, ny, n.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- Distant planets ---
        for (var i = 0; i < planets.length; i++) {
            var p = planets[i];
            var px = p.x - camera.x * BG.PARALLAX_PLANET;
            var py = p.y;

            px = ((px % cw) + cw) % cw;

            // Planet body
            var pGrad = ctx.createRadialGradient(px - p.radius * 0.3, py - p.radius * 0.3, p.radius * 0.1, px, py, p.radius);
            pGrad.addColorStop(0, p.color);
            pGrad.addColorStop(1, '#111122');
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(px, py, p.radius, 0, Math.PI * 2);
            ctx.fill();

            // Optional ring
            if (p.ringChance > 0.5) {
                ctx.strokeStyle = 'rgba(150,150,180,0.15)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(px, py, p.radius * 1.6, p.radius * 0.3, 0.3, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // --- Stars ---
        var time = performance.now() / 1000;
        for (var i = 0; i < stars.length; i++) {
            var s = stars[i];
            var sx = s.x - camera.x * BG.PARALLAX_STARS;
            var sy = s.y;

            // Wrap horizontally so stars cover the full viewport
            sx = ((sx % cw) + cw) % cw;

            // Twinkle
            var alpha = 0.5 + BG.STAR_TWINKLE_AMP * Math.sin(time * BG.STAR_TWINKLE_SPEED + s.twinkleOffset);

            ctx.globalAlpha = alpha;
            ctx.fillStyle = s.color;
            ctx.beginPath();
            ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    SpaceBoy.Background = {
        generate: generate,
        draw: draw,
    };
})();
