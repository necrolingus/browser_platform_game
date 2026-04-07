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

    // Dev / testing flag — when true, the player ignores all damage so you
    // can sprint through levels to test layouts. Leave false for normal play.
    GOD_MODE: false,
};

// Grid / tile system
SpaceBoy.TILE = {
    SIZE: 32,          // pixels per tile
};

// Level dimensions (in tiles)
// These are the DEFAULTS (initially set to level 1's dimensions). When a level
// is loaded, SpaceBoy.applyLevelDimensions(levelCfg) swaps these to match the
// selected level so spawner/camera/etc. keep working without knowing which
// level they're in.
SpaceBoy.LEVEL = {
    SCREENS: 5,
    PLAY_SCREENS: 4,
    WIDTH_TILES: Math.floor(960 / 32) * 5,
    HEIGHT_TILES: Math.floor(540 / 32),
    WIDTH_PX: Math.floor(960 / 32) * 5 * 32,
    HEIGHT_PX: Math.floor(540 / 32) * 32,
};

// Rewrite LEVEL values for the currently-loaded level config.
SpaceBoy.applyLevelDimensions = function (levelCfg) {
    var L = SpaceBoy.LEVEL;
    L.SCREENS = levelCfg.SCREENS;
    L.PLAY_SCREENS = levelCfg.PLAY_SCREENS;
    L.WIDTH_TILES = 30 * levelCfg.SCREENS;
    L.WIDTH_PX = L.WIDTH_TILES * 32;
    // height is constant across levels
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

    // --- Long flowy "Italian Stallion" white hair ---
    // 50 years passed between Level 1 and Level 2, so Space Boy! has aged
    // gracefully into a silver-haired action movie protagonist.
    HAIR: {
        COLOR: '#f5f5f5',           // creamy white
        COLOR_DARK: '#bdbdbd',      // mid-grey for shading the under-strands
        COLOR_HIGHLIGHT: '#ffffff', // pure white highlight strand
        BACK_STRANDS: 5,            // long flowy strands behind the head
        BACK_LENGTH: 28,            // px length of the longest back strand
        BACK_WIDTH: 4,              // base thickness of back strands
        FRINGE_STRANDS: 4,          // fringe strands across the forehead
        FRINGE_LENGTH: 10,          // px length of fringe strands
        FRINGE_WIDTH: 3,
        FLOW_AMP: 3.5,              // px wobble amplitude on hair tips
        FLOW_SPEED: 2.2,            // wobble cycles/sec
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

        // --- Mega-gun palette (used when MEGA weapon is selected) ---
        // Same shape as the normal gun, just recolored to match the mega
        // bullet's magenta theme so the player can see at a glance which
        // weapon is active.
        MEGA_COLOR_BODY: '#7722aa',
        MEGA_COLOR_BARREL: '#aa44dd',
        MEGA_COLOR_GRIP: '#551177',
        MEGA_COLOR_DETAIL: '#ff88ff',
        MEGA_COLOR_MUZZLE: '#ff44ff',
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

// Mega bullet — unlocked on level 2+, charged by collecting gems
SpaceBoy.MEGA_BULLET = {
    SPEED: 300,                // half of normal BULLET.SPEED (600)
    RADIUS: 15,                // 5x BULLET.RADIUS (3)
    COLOR: '#ff44ff',          // magenta
    GLOW_COLOR: 'rgba(255,68,255,0.55)',
    CORE_COLOR: '#ffffff',     // white hot core
    DAMAGE: 20,                // monster damage
    MAX_LIFETIME: 3,
    GEMS_PER_BULLET: 10,       // collect N gems → earn 1 mega bullet
    FIRE_RATE: 0.35,
};

// Weapon catalog — LMB fire modes. Each weapon is one of these IDs.
// Per-level weapon loadouts live in SpaceBoy.LEVELS.
SpaceBoy.WEAPONS = {
    NORMAL: 'normal',
    MEGA: 'mega',
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

    // --- Level 2 enemies ---

    // Kamikaze flying dasher — 1 HP, spots the player and dives at them
    dasher: {
        WIDTH: 28,
        HEIGHT: 22,
        HEALTH: 1,
        SCORE: 25,
        PATROL_SPEED: 60,
        DASH_SPEED: 380,        // very fast — act quickly!
        SIGHT_RANGE: 320,
        COLOR: '#ff2288',       // hot pink
        COLOR_DARK: '#aa0055',
        COLOR_GLOW: 'rgba(255,34,136,0.55)',
    },

    // Alien Frogger — 3 HP, hops like a frog and spits acid in an arc
    frogger: {
        WIDTH: 36,
        HEIGHT: 34,
        HEALTH: 3,
        SCORE: 40,
        HOP_INTERVAL_MIN: 1.6,  // seconds between hops
        HOP_INTERVAL_MAX: 2.6,
        HOP_SPEED_X: 80,        // horizontal hop velocity (px/sec)
        HOP_SPEED_Y: -380,      // initial upward hop velocity (px/sec)
        SHOOT_INTERVAL_MIN: 2.2,
        SHOOT_INTERVAL_MAX: 3.4,
        ACID_SPEED_X: 140,      // acid initial horizontal velocity
        ACID_SPEED_Y: -280,     // acid initial upward velocity (parabola peak)
        ACID_RADIUS: 5,
        ACID_DAMAGE: 1,
        ACID_LIFETIME: 3.5,
        ACID_COLOR: '#99ff22',
        ACID_GLOW: 'rgba(153,255,34,0.55)',
        SIGHT_RANGE: 400,
        COLOR: '#22cc55',       // swampy green
        COLOR_DARK: '#0f7730',
        COLOR_GLOW: 'rgba(34,204,85,0.5)',
        BELLY_COLOR: '#ccff88',
        EYE_COLOR: '#ffeb44',
    },
};

// Backwards-compat aliases (used by spawner.js and others)
SpaceBoy.WALKER = SpaceBoy.ENEMY_TYPES.walker;
SpaceBoy.CHARGER = SpaceBoy.ENEMY_TYPES.charger;
SpaceBoy.FLYER = SpaceBoy.ENEMY_TYPES.flyer;

// =============================================================================
// LEVELS — per-level configuration. Adding a new level = adding an entry.
// Includes weapon loadout, screen count, acid plant count, enemy spawn mix,
// boss type, intro story, and winning copy.
// =============================================================================
SpaceBoy.LEVELS = {
    1: {
        NUMBER: 1,
        TITLE: 'Level 1 — The Alien Jungle',
        SCREENS: 5,
        PLAY_SCREENS: 4,
        DATA_KEY: 'level1Data',
        WEAPONS: ['normal'],            // LMB weapons available (besides super)
        ACID_PLANTS: 3,
        BOSS_TYPE: 'alien_saucer',
        INTRO_STORY:
            "The galaxy is in shambles. Evil alien overlords have invaded " +
            "the jungle moon of Zarvox-7 and they're throwing the worst " +
            "house parties imaginable. You, yes you Space Boy!, have been " +
            "tasked with saving the universe and turning down the music. " +
            "Permanently.",
        WIN_MESSAGE: "Continue Space Boy!'s journey through space and time.",
        SPAWN: {
            PLATFORM_ENEMY_CHANCE: 0.24,
            PLATFORM_TYPES: ['walker', 'charger'],
            PLATFORM_CHARGER_RATIO: 0.3,
            GROUND: [{ type: 'charger', count: 12 }, { type: 'walker', count: 12 }],
            AIR: [{ type: 'flyer', count: 18, minRow: 2, maxRow: 11 }],
            SAFE_COLS: 6,
        },
    },
    2: {
        NUMBER: 2,
        TITLE: 'Level 2 — The Return',
        SCREENS: 9,                     // 8 play screens + 1 boss arena
        PLAY_SCREENS: 8,                // boss arena occupies the 9th screen
        DATA_KEY: 'level2Data',
        WEAPONS: ['normal', 'mega'],    // mouse wheel switches between these
        ACID_PLANTS: 5,
        BOSS_TYPE: 'emo_saucer',        // Greyus Prime Plus, the emo son
        INTRO_STORY:
            "50 years ago you defeated Greyus Prime. Now his son, the " +
            "superbly named Greyus Prime Plus, is out to avenge his " +
            "father. Intel suggests he is emo. " +
            "It is up to you to save the universe again!",
        WIN_MESSAGE: "Greyus Prime Plus has been defeated. The galaxy can finally take its eyeliner off.",
        SPAWN: {
            PLATFORM_ENEMY_CHANCE: 0.375, // 25% denser than the previous 0.30
            PLATFORM_TYPES: ['walker', 'charger', 'frogger'],
            PLATFORM_CHARGER_RATIO: 0.35,
            PLATFORM_FROGGER_RATIO: 0.25,
            GROUND: [
                { type: 'charger', count: 13 }, // +25%
                { type: 'walker',  count: 10 }, // +25%
                { type: 'frogger', count: 18 }, // +6 froggers, then +25%
            ],
            AIR: [
                { type: 'flyer',  count: 18, minRow: 2, maxRow: 11 }, // +25%
                { type: 'dasher', count: 20, minRow: 2, maxRow: 9 },  // +25%
            ],
            SAFE_COLS: 6,
        },
    },
    3: {
        NUMBER: 3,
        TITLE: 'Level 3 — ???',
        SCREENS: 0,
        PLAY_SCREENS: 0,
        DATA_KEY: null,
        WEAPONS: [],
        ACID_PLANTS: 0,
        BOSS_TYPE: null,
        INTRO_STORY: null,
        WIN_MESSAGE: null,
        COMING_SOON: true,
        COMING_SOON_MESSAGE: "Space Boy! is sleeping, come back later.",
        SPAWN: null,
    },
};

// --- Enemy "family" classification (used for drip colors, rendering hints) ---
SpaceBoy.ENEMY_FAMILY = {
    walker: 'ground',
    charger: 'ground',
    flyer:   'air',
    dasher:  'air',
    frogger: 'ground',
};

// Space background (adapts to level size)
SpaceBoy.BACKGROUND = {
    // Stars
    STAR_DENSITY: 0.0004,          // stars per px² (more = denser)
    STAR_MIN_SIZE: 0.5,
    STAR_MAX_SIZE: 2.5,
    STAR_COLORS: ['#ffffff', '#aaccff', '#ffddaa', '#ccddff', '#ffeedd'],
    STAR_TWINKLE_SPEED: 2,         // twinkle frequency
    STAR_TWINKLE_AMP: 0.3,         // alpha variation (0-1)
    PARALLAX_STARS: 0.15,          // how much stars move relative to camera (0=fixed, 1=full scroll)

    // Nebulae (colorful clouds)
    NEBULA_COUNT: 5,               // nebulae per level (scales with level size)
    NEBULA_MIN_RADIUS: 80,
    NEBULA_MAX_RADIUS: 200,
    NEBULA_COLORS: [
        'rgba(100, 50, 150, 0.08)',   // purple
        'rgba(50, 100, 180, 0.06)',   // blue
        'rgba(150, 50, 80, 0.07)',    // red
        'rgba(50, 150, 100, 0.05)',   // teal
        'rgba(180, 100, 50, 0.06)',   // orange
    ],
    PARALLAX_NEBULA: 0.08,         // nebulae move slower than stars

    // Distant planets (decorative)
    PLANET_COUNT: 2,
    PLANET_MIN_RADIUS: 20,
    PLANET_MAX_RADIUS: 50,
    PLANET_COLORS: ['#334466', '#553344', '#445544', '#444455'],
    PARALLAX_PLANET: 0.05,
};

// =============================================================================
// Boss config
// BOSS is shared across all bosses; BOSS_TYPES holds per-level parameters.
// Arena is always the final screen of the level (PLAY_SCREENS * 30 ... end).
// =============================================================================
SpaceBoy.BOSS = {
    ARENA_SCREENS: 1,                       // arena is always 1 camera-width
    HEALTH_BAR_WIDTH: 120,
    HEALTH_BAR_HEIGHT: 8,
    HEALTH_BAR_OFFSET_Y: -28,               // above boss top
    HEALTH_BAR_BG: '#222233',
    HEALTH_BAR_FILL: '#ff3355',
    HEALTH_BAR_BORDER: '#ffffff',
    HEALTH_BAR_GLOW: 'rgba(255,60,90,0.45)',
    HIT_FLASH_TIME: 0.12,
    DEATH_EXPLOSION_TIME: 1.2,
    DEATH_PARTICLE_COUNT: 60,
};

// Per-level boss parameters. Each entry is fully parameterized so new bosses
// can be dropped in without touching boss.js logic.
SpaceBoy.BOSS_TYPES = {
    // Level 1 — Grey alien in a flying saucer
    alien_saucer: {
        NAME: 'Greyus Prime',
        WIDTH: 100,                         // 5x player width (20 * 5)
        HEIGHT: 180,                        // 5x player height (36 * 5)
        HEALTH: 30,                         // user-requested: 30 HP
        SCORE: 500,
        CONTACT_DAMAGE: 1,

        // Movement — wirrrr around idly, charge occasionally
        MOVE_SPEED: 110,                    // px/sec base flying speed
        CHARGE_SPEED: 260,                  // px/sec during charge
        WIGGLE_AMP_X: 90,                   // horizontal wiggle amplitude
        WIGGLE_AMP_Y: 50,                   // vertical wiggle amplitude
        WIGGLE_FREQ_X: 0.8,                 // cycles/sec
        WIGGLE_FREQ_Y: 1.3,
        HOVER_Y_MIN: 60,                    // keep boss up in the air
        HOVER_Y_MAX: 220,

        // Distance rule — level 1 keeps its distance so player has breathing room
        MIN_DISTANCE_FROM_PLAYER: 260,      // px — never approach closer than this
        CHARGE_INTERVAL_MIN: 5,             // seconds between charges
        CHARGE_INTERVAL_MAX: 9,
        CHARGE_DURATION: 1.1,               // seconds a charge lasts

        // Shooting — randomized bursts with pauses so player can be aggressive
        SHOOT_PAUSE_MIN: 1.8,               // pause before next burst
        SHOOT_PAUSE_MAX: 3.4,
        SHOOT_BURST_MIN: 2,                 // bullets per burst
        SHOOT_BURST_MAX: 5,
        SHOOT_BURST_INTERVAL: 0.22,         // seconds between bullets in a burst
        SHOOT_SPREAD: 0.22,                 // radians of aim randomization
        BULLET_SPEED: 280,
        BULLET_RADIUS: 6,
        BULLET_LIFE: 4,
        BULLET_DAMAGE: 1,
        BULLET_COLOR: '#66ff88',
        BULLET_GLOW: 'rgba(102,255,136,0.55)',

        // Visual — grey alien head popping out of a flying saucer
        COLOR_SAUCER_TOP: '#d0d8e0',        // dome
        COLOR_SAUCER_BODY: '#8a96a4',       // metal body
        COLOR_SAUCER_DARK: '#4a5260',       // shadow
        COLOR_SAUCER_RIM: '#2a3040',        // rim outline
        COLOR_SAUCER_LIGHT: '#ffeaa0',      // lights on rim
        COLOR_ALIEN_SKIN: '#b9c2b0',        // grey-green alien skin
        COLOR_ALIEN_SKIN_DARK: '#7d8673',
        COLOR_ALIEN_EYE: '#0a0a10',         // big black eyes
        COLOR_ALIEN_EYE_HL: '#ffffff',
        COLOR_DOME_GLOW: 'rgba(180,220,255,0.35)',
    },

    // Level 2 — Greyus Prime Plus, the emo son. Same chassis as his father
    // but with stereotypical "the world doesn't get me" styling: black hair
    // hanging in his face, smudged black eyeliner, and a black saucer with
    // hot-pink accents.
    emo_saucer: {
        NAME: 'Greyus Prime Plus',
        WIDTH: 110,                         // slightly larger than dad
        HEIGHT: 195,
        HEALTH: 45,                         // tougher than dad
        SCORE: 800,
        CONTACT_DAMAGE: 1,

        // Movement — a bit more aggressive than dad. Same wiggle pattern.
        MOVE_SPEED: 130,
        CHARGE_SPEED: 300,
        WIGGLE_AMP_X: 100,
        WIGGLE_AMP_Y: 60,
        WIGGLE_FREQ_X: 0.9,
        WIGGLE_FREQ_Y: 1.4,
        HOVER_Y_MIN: 60,
        HOVER_Y_MAX: 230,

        MIN_DISTANCE_FROM_PLAYER: 240,
        CHARGE_INTERVAL_MIN: 4,
        CHARGE_INTERVAL_MAX: 7,
        CHARGE_DURATION: 1.2,

        SHOOT_PAUSE_MIN: 1.4,
        SHOOT_PAUSE_MAX: 2.8,
        SHOOT_BURST_MIN: 3,
        SHOOT_BURST_MAX: 6,
        SHOOT_BURST_INTERVAL: 0.2,
        SHOOT_SPREAD: 0.25,
        BULLET_SPEED: 320,
        BULLET_RADIUS: 6,
        BULLET_LIFE: 4,
        BULLET_DAMAGE: 1,
        BULLET_COLOR: '#ff44aa',            // hot pink bullets
        BULLET_GLOW: 'rgba(255,68,170,0.55)',

        // Visual — pink-and-black saucer, emo alien inside
        COLOR_SAUCER_TOP: '#3a2030',        // dark plum dome metal
        COLOR_SAUCER_BODY: '#1a1020',       // near-black body
        COLOR_SAUCER_DARK: '#08040c',       // shadow / underbelly
        COLOR_SAUCER_RIM: '#ff44aa',        // hot pink rim
        COLOR_SAUCER_LIGHT: '#ff88cc',      // pink running lights
        COLOR_ALIEN_SKIN: '#c8c8b8',        // a touch paler than dad — never goes outside
        COLOR_ALIEN_SKIN_DARK: '#7a7a6a',
        COLOR_ALIEN_EYE: '#0a0a10',
        COLOR_ALIEN_EYE_HL: '#ffffff',
        COLOR_DOME_GLOW: 'rgba(255,90,180,0.35)',

        // Emo-specific styling
        COLOR_HAIR: '#0a0a0e',              // jet black emo hair
        COLOR_HAIR_HL: '#332244',           // subtle purple sheen highlight
        COLOR_EYELINER: '#000000',          // smudged black eyeliner
    },
};

// Acid plant (obstacle)
SpaceBoy.ACID_PLANT = {
    COUNT_PER_LEVEL: 3,            // number of plants per level
    WIDTH: 60,                     // plant base width (3x bigger)
    HEIGHT: 72,                    // plant body height (3x bigger)
    SHOOT_INTERVAL: 2,             // seconds between acid bursts
    SHOOT_DURATION: 1,             // seconds acid shoots upward
    ACID_WIDTH: 10,                // acid stream width (scaled up)
    ACID_HEIGHT: 320,              // how high acid shoots (4x higher)
    ACID_SPEED: 400,               // acid rise speed (px/sec)
    SAFE_COLS_FROM_SPAWN: 10,      // minimum cols from spawn point
    MIN_SPACING_COLS: 15,          // minimum cols between plants

    // Colors — vivid alien palette to stand out from terrain
    COLOR_STEM: '#8B1A8B',         // dark magenta stem
    COLOR_BODY: '#CC22CC',         // vivid magenta body
    COLOR_BODY_DARK: '#991199',    // darker magenta shading
    COLOR_BODY_LIGHT: '#EE55EE',   // highlight
    COLOR_MOUTH: '#440044',        // deep purple mouth interior
    COLOR_ACID: '#aaff00',         // acid color
    COLOR_ACID_GLOW: 'rgba(170, 255, 0, 0.4)',
    COLOR_SPOTS: '#FF44FF',        // bright pink spots
    COLOR_OUTLINE: '#FF00FF',      // neon magenta outline/glow
};

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
