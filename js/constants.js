// =============================================================================
// Space Boy! — Game Constants
// All tunable game parameters live here.
// =============================================================================

window.SpaceBoy = window.SpaceBoy || {};

SpaceBoy.GAME = {
    TITLE: 'Space Boy!',
    FPS: 60,
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 540,
    BACKGROUND_COLOR: '#0b0e17',
};

// Grid / tile system
SpaceBoy.TILE = {
    SIZE: 32,          // pixels per tile
};

// Level dimensions (in tiles)
SpaceBoy.LEVEL = {
    SCREENS: 4,                                          // number of camera-widths
    WIDTH_TILES: Math.floor(960 / 32) * 4,               // 30 tiles/screen × 4 = 120
    HEIGHT_TILES: Math.floor(540 / 32),                   // 16 tiles high (512px used)
    WIDTH_PX: Math.floor(960 / 32) * 4 * 32,             // 3840 px
    HEIGHT_PX: Math.floor(540 / 32) * 32,                // 512 px  (fits in 540 canvas)
};

// Tile types (used in level maps)
SpaceBoy.TILES = {
    EMPTY: 0,
    GROUND: 1,
    PLATFORM: 2,
    LAVA: 3,
    SPAWN: 4,           // player spawn point
};

// Tile colors (used as fallback / lava)
SpaceBoy.TILE_COLORS = {
    [SpaceBoy.TILES.EMPTY]: null,
    [SpaceBoy.TILES.GROUND]: '#8B6B4A',
    [SpaceBoy.TILES.PLATFORM]: '#8B6B4A',
    [SpaceBoy.TILES.LAVA]: '#ff4500',
};

// Terrain visual style
SpaceBoy.TERRAIN = {
    // Soil
    SOIL_COLOR: '#8B6B4A',          // light brown soil
    SOIL_COLOR_DARK: '#6B4F2E',     // darker soil patches
    SOIL_SPECKLE: '#A07840',        // lighter speckle dots
    SOIL_DETAIL_COUNT: 4,           // dirt details per tile

    // Grass
    GRASS_COLOR: '#44AA22',         // main grass
    GRASS_COLOR_DARK: '#338811',    // darker grass accent
    GRASS_COLOR_LIGHT: '#66CC33',   // bright grass highlight
    GRASS_TOP_HEIGHT: 6,            // grass strip on top of tile (px)
    GRASS_BLADE_COUNT: 5,           // blades per tile
    GRASS_BLADE_HEIGHT: 8,          // max blade height above tile
    GRASS_DRAPE_COUNT: 4,           // hanging grass strands on front face
    GRASS_DRAPE_MAX_LENGTH: 10,     // max drape strand length (px)

    // Flowers (ground decoration only)
    FLOWER_COLORS: ['#FFD700', '#FF69B4', '#9933CC', '#FF6633', '#FF3333', '#FF88AA'],
    FLOWER_CHANCE: 0.3,             // probability a ground tile gets a flower
    FLOWER_SIZE: 3,                 // petal radius
    FLOWER_STEM_HEIGHT: 6,         // stem height
    FLOWER_STEM_COLOR: '#2D8B1A',  // stem green
    FLOWER_CENTER_COLOR: '#FFE066', // flower center dot
};

// Player
SpaceBoy.PLAYER = {
    WIDTH: 20,
    HEIGHT: 36,
    COLOR: '#00ccff',
    SPEED: 200,                // px/sec horizontal
    JUMP_VELOCITY: -420,       // px/sec (negative = up)
    DOUBLE_JUMP_VELOCITY: -360, // px/sec (slightly weaker second jump)
    MAX_JUMPS: 2,              // 1 = normal, 2 = double jump
    LEAP_VELOCITY_X: 120,     // extra horizontal px/sec added when leaping
    AIR_CONTROL: 0.6,          // fraction of ground acceleration available in air
    MAX_HEALTH: 3,
    INVINCIBILITY_TIME: 1.5,   // seconds of invincibility after being hit
    GUN_LENGTH: 22,            // visual length of gun line from center
    GUN_COLOR: '#ffcc00',

    // --- Blob visual (rendering only, never used for physics) ---
    BLOB: {
        COLOR: '#33ee55',              // main blob green
        COLOR_DARK: '#22aa33',         // shading
        COLOR_LIGHT: '#88ffaa',        // highlight
        EYE_COLOR: '#ffffff',
        PUPIL_COLOR: '#111111',
        RADIUS_X: 14,                 // base horizontal radius
        RADIUS_Y: 16,                 // base vertical radius
        WOBBLE_POINTS: 8,             // control points around perimeter
        WOBBLE_AMP: 2.5,             // idle wobble amplitude (px)
        WOBBLE_SPEED: 4,             // idle wobble frequency (cycles/sec)
        MOVE_STRETCH_X: 1.2,         // horizontal stretch when running
        MOVE_SQUASH_Y: 0.85,         // vertical squash when running
        JUMP_STRETCH_Y: 1.25,        // vertical stretch when airborne
        JUMP_SQUASH_X: 0.8,          // horizontal squash when airborne
        EYE_SIZE: 4,                 // eye radius
        PUPIL_SIZE: 2,               // pupil radius
        EYE_OFFSET_X: 4,            // eye distance from center
        EYE_OFFSET_Y: -4,           // eye height above center
        ARM_LENGTH: 10,              // upper arm length
        ARM_WIDTH: 7,                // arm thickness (beefy)
        FOREARM_LENGTH: 8,           // forearm to gun
        FOREARM_WIDTH: 6,            // forearm thickness
        ARM_COLOR: '#2bcc44',        // arm blob green (slightly darker than body)
        ARM_COLOR_DARK: '#1f9933',   // arm shading
        ARM_OFFSET_Y: 2,            // arm attachment point below blob center
        ARM_WOBBLE_AMP: 1.5,        // arm jiggle amplitude
        ARM_WOBBLE_SPEED: 5,        // arm jiggle speed
        BICEP_BULGE: 3,             // extra radius for the bicep bump
    },

    // --- Oversized gun visual (30% bigger) ---
    GUN: {
        BODY_LENGTH: 36,             // gun body length
        BODY_WIDTH: 13,              // gun body thickness
        BARREL_LENGTH: 18,           // barrel extension
        BARREL_WIDTH: 8,             // barrel thickness
        GRIP_LENGTH: 10,             // grip below gun body
        GRIP_WIDTH: 7,
        COLOR_BODY: '#666688',       // gun body
        COLOR_BARREL: '#888899',     // barrel
        COLOR_GRIP: '#555566',       // grip
        COLOR_MUZZLE: '#ffaa00',     // muzzle flash color
        COLOR_DETAIL: '#99aacc',     // accent line
        MUZZLE_FLASH_TIME: 0.06,    // seconds flash is visible after shot
    },
};

// Physics
SpaceBoy.PHYSICS = {
    GRAVITY: 980,              // px/sec²
    TERMINAL_VELOCITY: 600,    // max fall speed px/sec
};

// Bullets
SpaceBoy.BULLET = {
    SPEED: 600,                // px/sec
    RADIUS: 3,
    COLOR: '#ffcc00',
    DAMAGE: 1,                 // damage per normal bullet
    MAX_LIFETIME: 2,           // seconds before despawn
    FIRE_RATE: 0.2,            // min seconds between shots
};

// Super bullet
SpaceBoy.SUPER_BULLET = {
    SPEED: 500,                // px/sec (slightly slower, heavier feel)
    RADIUS: 6,                 // bigger than normal
    COLOR: '#00ffff',          // cyan
    GLOW_COLOR: 'rgba(0,255,255,0.5)',
    DAMAGE: 5,                 // damage per super bullet
    MAX_LIFETIME: 3,           // lasts longer
    KILLS_TO_CHARGE: 5,        // kills needed per super bullet
    FIRE_RATE: 0.3,            // cooldown between super shots
};

// Enemies — shared visual config
SpaceBoy.ENEMY = {
    KILL_SCORE: 10,
    BLOB_POINTS: 7,              // control points for blob shape
    BLOB_WOBBLE_AMP: 2,          // wobble amplitude (px)
    BLOB_WOBBLE_SPEED: 5,        // wobble frequency (cycles/sec)
    PULSE_SPEED: 3,              // pulsate frequency (cycles/sec)
    PULSE_AMP: 0.08,             // pulsate scale range (fraction)
    GLOW_RADIUS: 8,              // neon glow spread (px)
    EYE_SIZE: 3,                 // eye radius
    PUPIL_SIZE: 1.5,             // pupil radius
    HIT_FLASH_TIME: 0.2,        // seconds enemy flashes white after being hit

    // Hit particles
    HIT_PARTICLE_COUNT: 12,     // particles per hit
    HIT_PARTICLE_SPEED: 200,    // px/sec radial speed
    HIT_PARTICLE_LIFE: 0.6,     // seconds particles live
    HIT_PARTICLE_SIZE: 5,       // particle radius

    // Injured drip (continuous leak when damaged)
    DRIP_INTERVAL: 0.12,        // seconds between drip bursts
    DRIP_PARTICLE_COUNT: 2,     // particles per drip burst
    DRIP_PARTICLE_SPEED: 60,    // px/sec radial speed (slower than hit burst)
    DRIP_PARTICLE_LIFE: 0.5,    // seconds drip particles live

    // --- Spawning parameters ---
    SPAWN: {
        PLATFORM_ENEMY_CHANCE: 0.24,    // +20%
        PLATFORM_CHARGER_RATIO: 0.3,
        GROUND_CHARGERS: 12,            // +20%
        FLYERS: 18,                     // +20%
        FLYER_MIN_ROW: 2,
        FLYER_MAX_ROW: 11,
        SPAWN_SAFE_COLS: 6,
    },
};

// --- Enemy type registry (type → stats) ---
// Each type: width, height, health, score, colors, plus type-specific props
SpaceBoy.ENEMY_TYPES = {
    walker: {
        WIDTH: 26,
        HEIGHT: 36,
        HEALTH: 1,
        SCORE: 10,
        SPEED: 60,
        COLOR: '#cc3333',
        COLOR_DARK: '#991a1a',
        COLOR_GLOW: 'rgba(204,51,51,0.4)',
    },
    charger: {
        WIDTH: 31,
        HEIGHT: 39,
        HEALTH: 2,
        SCORE: 20,
        PATROL_SPEED: 40,
        CHARGE_SPEED: 220,
        SIGHT_RANGE: 250,
        COLOR: '#cc6600',
        COLOR_DARK: '#994d00',
        COLOR_GLOW: 'rgba(204,102,0,0.4)',
    },
    flyer: {
        WIDTH: 29,
        HEIGHT: 29,
        HEALTH: 2,
        SCORE: 15,
        SPEED: 80,
        AMPLITUDE: 40,
        FREQUENCY: 2,
        COLOR: '#9933cc',
        COLOR_DARK: '#6b2491',
        COLOR_GLOW: 'rgba(153,51,204,0.4)',
    },
};

// Backwards-compat aliases (used by spawner.js and others)
SpaceBoy.WALKER = SpaceBoy.ENEMY_TYPES.walker;
SpaceBoy.CHARGER = SpaceBoy.ENEMY_TYPES.charger;
SpaceBoy.FLYER = SpaceBoy.ENEMY_TYPES.flyer;

// Space gems
SpaceBoy.GEM = {
    SIZE: 14,
    COLOR: '#00ffaa',
    GLOW_COLOR: 'rgba(0,255,170,0.3)',
};

// Camera
SpaceBoy.CAMERA = {
    DEAD_ZONE_X: 80,           // px from center before camera follows
};

// HUD
SpaceBoy.HUD = {
    HEART_SIZE: 10,
    HEART_COLOR: '#ff3366',
    HEART_EMPTY_COLOR: '#333344',
    HEART_OFFSET_Y: -12,       // above player top
    HEART_SPACING: 14,
    FONT: '16px monospace',
    FONT_SMALL: '12px monospace',
    TEXT_COLOR: '#ffffff',
    SCORE_X: 10,
    SCORE_Y: 24,
    GEM_X: 10,
    GEM_Y: 46,
    KILLS_Y: 68,              // y position for kill stats

    // Charge bar (above hearts)
    CHARGE_BAR_WIDTH: 30,
    CHARGE_BAR_HEIGHT: 4,
    CHARGE_BAR_OFFSET_Y: -22, // above hearts
    CHARGE_BAR_BG: '#222233',
    CHARGE_BAR_FILL: '#00ccff',
    CHARGE_BAR_FULL: '#00ffff',

    // Super bullet count
    SUPER_ICON_SIZE: 6,
    SUPER_ICON_COLOR: '#00ffff',
    SUPER_ICON_OFFSET_Y: -30, // above charge bar
    SUPER_ICON_SPACING: 10,
};
