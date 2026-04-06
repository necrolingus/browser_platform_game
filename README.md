# Space Boy!

> A gooey green blob with a comically oversized gun, stranded on an alien
> world, shooting everything that pulsates.

A side-scrolling platform shooter built with **vanilla JavaScript and HTML5
Canvas**. No frameworks. No build step. No server. No dependencies. Just
double-click `index.html` and you're playing.

---

## The Story

You are **Space Boy** — a heroic little green blob with buff biceps and a gun
bigger than your entire body. Your ship crashed on an alien planet crawling
with neon glob-creatures, acid-spitting plants, and one very rude Grey alien
piloting a flying saucer. There's only one way home: **blast your way
through.**

---

## Features

- **Procedural everything.** The hero, enemies, terrain, flowers, stars,
  nebulae, and the boss are all drawn with canvas primitives. No sprite
  sheets, no asset loading, no missing-image pink squares.
- **Gooey blob hero** with wobbling control-point animation, squash/stretch,
  buff biceps, and a gun that is anatomically absurd by design.
- **Three enemy types** — pulsating neon globs, each with their own brains:
  - **Walker** — 1 HP. Patrols platforms. Friendly-ish. Dies politely.
  - **Charger** — 2 HP. Halloween jack-o'-lantern teeth. Will absolutely run
    at you if you get too close.
  - **Flyer** — 2 HP. Bobs through the air in a smug little sine wave.
- **Super Bullets.** Every 5 kills you earn one. Fire with `Space`. Deals
  5 damage. Glows cyan. Looks cool. Saves lives.
- **Acid plants.** Vivid magenta alien flytraps that spit a four-story
  column of acid every 2 seconds. Solid bodies — you have to jump over them.
- **Parallax space background** that scales to the level size, with
  twinkling stars, nebulae, and distant planets.
- **Boss arena** at the end of every level with its own locked camera screen.
- **Level 1 boss: Greyus Prime** — a classic grey alien in a flying saucer.
  5x the player's size, 30 HP, never gets too close on level 1 to keep
  things friendly. Shoots green plasma bursts with pauses between so you can
  push forward and take risks.
- **Fully parameterized.** Every tunable value lives in `js/constants.js`.
  Want a harder boss? Faster bullets? More flyers? Change a number.
- **Level validator.** Auto-fixes misplaced gems and floating enemies, warns
  you about unreachable platforms and unjumpable lava gaps, and derives the
  player's actual physics limits at load time.

---

## Controls

| Action | Key |
| --- | --- |
| Move | `A` / `D` |
| Jump | **Right Click** (press again mid-air for double jump) |
| Aim | **Mouse** |
| Shoot | **Left Click** |
| Super Shot | `Space` |

> **Tip:** Super Bullets carry over between deaths. Save them for the boss.
> You'll thank yourself later.

---

## How to Play

1. Open `index.html` in a modern browser.
2. Click to start.
3. Blast globs. Collect space gems. Don't touch the lava. Don't touch the
   acid. Don't touch the chargers.
4. At the end of the level, cross into the final screen. The camera locks.
   A flying saucer shows up.
5. Empty your magazine into Greyus Prime until he pops.
6. Receive your "Well Done!" screen and gloat.

---

## Project Structure

```
browser_platform_game/
├── index.html              Entry point — just double-click it
├── css/
│   └── style.css           Screens, fonts, layout
└── js/
    ├── constants.js        ALL tunable game values live here
    ├── input.js            Keyboard + mouse (layout-independent)
    ├── camera.js           Follow camera with dead zone + arena lock
    ├── physics.js          Axis-by-axis collision resolution
    ├── level.js            Level loader + Mario-style tile renderer
    ├── player.js           Space Boy — blob, arms, gun, shooting, jumping
    ├── enemies.js          Walker / Charger / Flyer + hit particles
    ├── gems.js             Collectible space gems
    ├── hud.js              Hearts, score, kill counts, super bullet meter
    ├── validator.js        Auto-validates level data against physics
    ├── spawner.js          Generates enemy placements from tile data
    ├── background.js       Procedural parallax starfield / nebulae / planets
    ├── acidplant.js        Indestructible acid-spitting obstacles
    ├── boss.js             Parameterized boss mechanics + renderers
    ├── levels/
    │   └── level1.js       Tile data for level 1
    └── main.js             Game loop, state machine, update/render
```

---

## Design Principles

1. **No dependencies.** Not even a tiny one. The entire game is served by
   opening a single HTML file. This works over `file://`, local dev servers,
   static hosting — everywhere.
2. **Parameterize everything.** If a number has feel (damage, speed, color,
   size, timing, spawn rate), it lives in `constants.js`. Tuning the game
   should never require hunting through logic files.
3. **Separation of visuals and hitboxes.** The physics engine only ever
   touches `width` / `height` / `x` / `y`. The blob wobble, gun rotation,
   muzzle flash, and death explosions can't accidentally break movement.
4. **Pluggable bosses.** Adding a new boss is a config entry in
   `BOSS_TYPES` plus a renderer function in `SpaceBoy.BossRenderers`. The
   mechanics (wiggle, charge, shoot bursts, health bar, death explosion)
   are shared.
5. **Deterministic level generation.** Stars, flowers, and enemy placements
   all use seeded RNG so the world is stable between reloads.

---

## Deploying

This is a static site with zero build step. To host:

- **Cloudflare Pages / Netlify / GitHub Pages / S3 / any static host:**
  point it at the repo root.
  - Build command: *(none)*
  - Output directory: `/`
- **Self-host:** drop the folder in any HTTP server, or just open
  `index.html` directly.

---

## Requirements

- A desktop browser with HTML5 Canvas support (Chrome, Firefox, Edge,
  Safari — anything from the last decade).
- A keyboard and a mouse.

> Mobile is detected and politely turned away. Sorry phone players —
> the gun is too big for a touchscreen.

---

## Tuning the Game

Everything interesting is in `js/constants.js`. Some greatest hits:

| Want to... | Change |
| --- | --- |
| Make the player faster | `PLAYER.SPEED` |
| Make double jump higher | `PLAYER.DOUBLE_JUMP_VELOCITY` |
| Make super bullets cheaper | `SUPER_BULLET.KILLS_TO_CHARGE` |
| Spawn more flyers | `ENEMY.SPAWN.FLYERS` |
| Give the boss more HP | `BOSS_TYPES.alien_saucer.HEALTH` |
| Make the boss close in | lower `MIN_DISTANCE_FROM_PLAYER` |
| Change level length | `LEVEL.SCREENS` / `LEVEL.PLAY_SCREENS` |
| Recolor everything | every color is a named constant |

---

## Roadmap

- **Level 2** *(coming soon!)* — new biome, new enemies, new boss
- More boss types (robot king, sentient asteroid, the usual)
- Per-level soundtracks (the moment an audio file enters the repo, it stops
  being a "just double-click it" game — still deciding if that's worth it)
- Checkpoints

---

## Credits

- Made by **Leigh**, with a slightly excessive amount of iteration.
- Built with a lot of help from Claude Code (Anthropic's coding agent).
- Greyus Prime has no agent and does not wish to comment at this time.
