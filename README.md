# 🚀 Space Boy! 👾

> A gooey green blob with a comically oversized gun, stranded on an alien
> world, shooting everything that pulsates. 💥

A side-scrolling platform shooter built with **vanilla JavaScript and HTML5
Canvas**. No frameworks. No build step. No server. No dependencies.
Just double-click `index.html` and you're playing. 🎮✨

---

## 📖 The Story

You are **Space Boy** 🟢 — a heroic little green blob with buff biceps 💪
and a gun bigger than your entire body. Your ship crashed on an alien
planet crawling with neon glob-creatures 👾, acid-spitting plants 🌸💚,
and an entire dynasty of Grey aliens 👽 piloting flying saucers 🛸.

There's only one way home: **blast your way through three levels of
escalating mayhem.** 🔫💥

---

## ✨ Features

### 🎨 Procedural Everything
The hero, enemies, terrain, flowers 🌼, stars ⭐, nebulae 🌌, and bosses
are all drawn with canvas primitives. No sprite sheets. No asset loading.
No missing-image pink squares. 🎨

### 🟢 Gooey Blob Hero
Wobbling control-point animation, squash & stretch, buff biceps 💪, and a
gun that is **anatomically absurd by design**. He bounces when he walks.
He stretches when he jumps. He will wiggle at you. From Level 2 onwards
he sports flowing hair 💇 because even blobs can have a glow-up.

### 👾 Five Enemy Types
All neon glob-creatures, all pulsating, all doomed:

| Enemy | HP | Vibe |
| --- | --- | --- |
| 🔴 **Walker** | 1 | Patrols platforms. Friendly-ish. Dies politely. |
| 🟠 **Charger** | 2 | Halloween jack-o'-lantern teeth 🎃. Will absolutely run at you. |
| 🟣 **Flyer** | 2 | Bobs through the air in a smug little sine wave. |
| 💖 **Dasher** | 1 | Kamikaze diver. Spots you and screams in at top speed. |
| 🐸 **Frogger** | 3 | Hops like a frog, spits acid in an arc. Very annoying. |

Dashers and Froggers appear from Level 2 onwards.

### ⚡ Super Bullets
Every **5 kills** you earn one. Fire with `Space`. Deals **5 damage**.
Glows cyan 💠. Looks cool 😎. Saves lives.

### 💜 Mega Bullets *(Level 2+)*
Collect **10 space gems** 💎 to earn one mega bullet. **5x the size, 20
damage**, passes through enemies, and looks absolutely devastating. Switch
to the mega gun with **mouse wheel** 🖲️. The gun even recolours to
magenta so you know which weapon is active.

Each level starts fresh — no ammo carries over. Earn it all again! 💪

### 🌸 Acid Plants
Vivid magenta alien flytraps that spit a four-story column of acid every
2 seconds. Solid bodies — you have to **jump over them**. 🦘

### 🌌 Parallax Space Background
Scales to the level size, with twinkling stars ⭐, drifting nebulae 🌠,
and distant planets 🪐. It's the little things.

### 🛸 Boss Arenas
Every level ends in a locked-camera boss arena. No enemies. No obstacles.
Just you, some platforms, and a very angry alien (or three).

---

## 🗺️ The Levels

### Level 1 — The Alien Jungle 🌿
4 play screens + boss arena. Walkers, Chargers, and Flyers. Normal gun
only. Your introduction to the galaxy's worst neighbourhood.

**Boss: Greyus Prime** 👽 — A classic Grey alien in a flying saucer.
**5x** your size. **50 HP.** Keeps his distance and shoots green plasma
bursts 💚 with pauses between so you can push forward.

### Level 2 — The Return 🌑
8 play screens + boss arena. Introduces **Dashers** and **Froggers**.
Unlocks the **mega gun** 💜 and mouse-wheel weapon switching. More acid
plants. Story intro screen with mechanic hints.

**Boss: Greyus Prime Plus** 🖤 — The emo son. Black saucer, hot-pink
accents, smudged eyeliner. **75 HP.** More aggressive than dad, faster
charges, denser bullet bursts. Classic daddy issues.

### Level 3 — Sector 9 🌑
8 play screens + boss arena. Monochrome desaturated terrain (ghostly
negative-photograph look). Enemy density cranked to maximum — every
platform is dangerous. The final showdown.

**Boss: The Greyus Triplets** 👽👽👽 — Three saucers orbiting in
triangular formation, connected by pulsing red energy beams. **180 shared
HP** — hitting any saucer drains the same pool. Every 10th shot across
all three is an **uber bullet** (massive, glowing, instant kill). All
three fire simultaneously. Dark metal saucers with red accents.

---

## 🎮 Controls

| Action | Key |
| --- | --- |
| 🏃 Move | `A` / `D` |
| 🦘 Jump (x2!) | **Right Click** *(tap again mid-air for double jump)* |
| 🎯 Aim | **Mouse** |
| 🔫 Shoot | **Left Click** |
| ⚡ Super Shot | `Space` |
| 🔄 Switch Weapon | **Mouse Wheel** *(Level 2+ only)* |

> 💡 **Pro tip:** Save your supers and megas for the boss. You'll thank
> yourself later. 🙏

---

## 🕹️ How to Play

1. 🖱️ Open `index.html` in a modern browser.
2. 👆 Pick a level from the start screen.
3. 📖 Read the story intro, then click **Start Mission**.
4. 💥 Blast globs. Collect space gems 💎. Don't touch the lava 🔥. Don't
   touch the acid 🧪. Don't touch the chargers 🎃.
5. 🏁 At the end of the level, cross into the final screen. The camera
   locks. A flying saucer shows up. 🛸
6. 🔫 Empty your magazine into the boss until they pop. 💥
7. 🏆 Receive your stats screen and **gloat.** 😎
8. ➡️ Click **Go to next level** or hit **Menu** to return to level select.

---

## 📁 Project Structure

```
browser_platform_game/
├── 📄 index.html           Entry point — just double-click it
├── 🟢 favicon.svg          Little green blob favicon
├── 🎨 css/
│   └── style.css           Screens, fonts, layout
└── 📦 js/
    ├── constants.js        ⚙️  ALL tunable game values live here
    ├── input.js            ⌨️  Keyboard + mouse (layout-independent)
    ├── camera.js           📹  Follow camera + arena lock
    ├── physics.js          🧲  Axis-by-axis collision resolution
    ├── level.js            🌱  Tile loader + Mario-style terrain
    ├── player.js           🟢  Space Boy — blob, arms, gun, hair, shooting
    ├── enemies.js          👾  Walker / Charger / Flyer / Dasher / Frogger + particles
    ├── gems.js             💎  Collectible space gems
    ├── hud.js              ❤️  Hearts, score, kills, super meter, menu button
    ├── validator.js        ✅  Auto-validates level data
    ├── spawner.js          🎲  Generates enemy placements from tiles
    ├── background.js       🌌  Parallax starfield / nebulae / planets
    ├── acidplant.js        🌸  Indestructible acid-spitting obstacles
    ├── boss.js             🛸  Parameterized boss mechanics + renderers
    ├── levels/
    │   ├── level1.js       🗺️  Tile data for level 1
    │   ├── level2.js       🗺️  Tile data for level 2
    │   └── level3.js       🗺️  Tile data for level 3
    └── main.js             🎮  Game loop, state machine, update/render
```

---

## 🧠 Design Principles

1. 🚫 **No dependencies.** Not even a tiny one. The entire game is served
   by opening a single HTML file. Works over `file://`, local dev servers,
   static hosting — **everywhere.**
2. 🎛️ **Parameterize everything.** If a number has feel (damage, speed,
   color, size, timing, spawn rate), it lives in `constants.js`. Tuning
   the game should never require hunting through logic files.
3. 🔒 **Hitboxes and visuals are separated.** The physics engine only ever
   touches `width` / `height` / `x` / `y`. The blob wobble, gun rotation,
   muzzle flash, and death explosions **can't accidentally break
   movement.** (Ask me how I know.) 😅
4. 🛸 **Pluggable bosses.** Adding a new boss is a config entry in
   `BOSS_TYPES` plus a renderer function in `SpaceBoy.BossRenderers`. The
   mechanics (wiggle, charge, shoot bursts, health bar, death explosion)
   are shared.
5. 🗺️ **Pluggable levels.** Adding a new level is a tile map in
   `js/levels/`, a config entry in `LEVELS`, and a button on the start
   screen. Enemy spawning, acid plants, and boss arenas are all generated
   from the config.
6. 🎲 **Deterministic worlds.** Stars, flowers, and enemy placements all
   use seeded RNG so the universe is stable between reloads.
7. 🔄 **Fresh start per level.** Each level resets score, ammo, gems, and
   weapons. No carrying over — you earn everything from scratch.

---

## 🚢 Deploying

Zero build step. Zero config. Zero excuses. 😤

- ☁️ **Cloudflare Pages / Netlify / GitHub Pages / S3 / any static host:**
  - Build command: *(none)* 🙅
  - Output directory: `/`
- 🏠 **Self-host:** drop the folder in any HTTP server, or just open
  `index.html` directly.

---

## 🖥️ Requirements

- 🌐 A desktop browser with HTML5 Canvas support (Chrome, Firefox, Edge,
  Safari — anything from the last decade).
- ⌨️ A keyboard.
- 🖱️ A mouse.

> 📱 **Mobile is detected and politely turned away.** Sorry phone players —
> the gun is too big for a touchscreen. 😂

---

## 🎛️ Tuning the Game

Everything interesting is in `js/constants.js`. Some greatest hits 🎵:

| Want to... | Change |
| --- | --- |
| 🏃 Make the player faster | `PLAYER.SPEED` |
| 🦘 Make double jump higher | `PLAYER.DOUBLE_JUMP_VELOCITY` |
| ⚡ Make super bullets cheaper | `SUPER_BULLET.KILLS_TO_CHARGE` |
| 💜 Make mega bullets cheaper | `MEGA_BULLET.GEMS_PER_BULLET` |
| 🦋 Spawn more flyers | `LEVELS[n].SPAWN.AIR` |
| 💪 Give a boss more HP | `BOSS_TYPES.<boss_name>.HEALTH` |
| 😈 Make the boss close in | lower `MIN_DISTANCE_FROM_PLAYER` |
| 🎨 Recolor everything | every color is a named constant |

---

## 🗺️ Roadmap

- 🎵 Per-level soundtracks *(the moment an audio file enters the repo, it
  stops being a "just double-click it" game — still deciding if that's
  worth it)*
- 🚩 Checkpoints
- 💾 High scores
- 🌍 More levels — the universe is big

---

## 🙌 Credits

- 👨‍💻 Made by **Leigh**, with a slightly excessive amount of iteration.
- 🤖 Built with a lot of help from **Claude Code** (Anthropic's coding agent).
- 👽 **The Greyus family** has no agent and does not wish to comment at
  this time. Except the emo one. He wrote a poem about it.

---

### ⭐ Now go shoot some globs. ⭐
