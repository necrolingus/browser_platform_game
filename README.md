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
and one very rude Grey alien 👽 piloting a flying saucer 🛸.

There's only one way home: **blast your way through.** 🔫💥

---

## ✨ Features

### 🎨 Procedural Everything
The hero, enemies, terrain, flowers 🌼, stars ⭐, nebulae 🌌, and the boss
are all drawn with canvas primitives. No sprite sheets. No asset loading.
No missing-image pink squares. 🎨

### 🟢 Gooey Blob Hero
Wobbling control-point animation, squash & stretch, buff biceps 💪, and a
gun that is **anatomically absurd by design**. He bounces when he walks.
He stretches when he jumps. He will wiggle at you.

### 👾 Three Enemy Types
All neon glob-creatures, all pulsating, all doomed:

| Enemy | HP | Vibe |
| --- | --- | --- |
| 🔴 **Walker** | 1 | Patrols platforms. Friendly-ish. Dies politely. |
| 🟠 **Charger** | 2 | Halloween jack-o'-lantern teeth 🎃. Will absolutely run at you. |
| 🟣 **Flyer** | 2 | Bobs through the air in a smug little sine wave. |

### ⚡ Super Bullets
Every **5 kills** you earn one. Fire with `Space`. Deals **5 damage**.
Glows cyan 💠. Looks cool 😎. Saves lives.

### 🌸 Acid Plants
Vivid magenta alien flytraps that spit a four-story column of acid every
2 seconds. Solid bodies — you have to **jump over them**. 🦘

### 🌌 Parallax Space Background
Scales to the level size, with twinkling stars ⭐, drifting nebulae 🌠,
and distant planets 🪐. It's the little things.

### 🛸 Boss Arena
Every level ends in a locked-camera boss arena. No enemies. No obstacles.
Just you, some platforms, and a very angry alien.

### 👽 Level 1 Boss: Greyus Prime
A classic Grey alien in a flying saucer. **5x** your size. **30 HP.**
Keeps his distance (for now 😉). Shoots green plasma bursts 💚 with
pauses between so you can push forward and take risks.

### 🎛️ Fully Parameterized
Every tunable value lives in `js/constants.js`. Want a harder boss?
Faster bullets? More flyers? **Change a number.** That's the whole workflow.

### ✅ Level Validator
Auto-fixes misplaced gems and floating enemies, warns you about
unreachable platforms and unjumpable lava gaps, and derives the player's
actual physics limits at load time. It's basically a little robot QA 🤖
that ships with the game.

---

## 🎮 Controls

| Action | Key |
| --- | --- |
| 🏃 Move | `A` / `D` |
| 🦘 Jump (x2!) | **Right Click** *(tap again mid-air for double jump)* |
| 🎯 Aim | **Mouse** |
| 🔫 Shoot | **Left Click** |
| ⚡ Super Shot | `Space` |

> 💡 **Pro tip:** Super Bullets carry over between deaths. **Save them for
> the boss.** You'll thank yourself later. 🙏

---

## 🕹️ How to Play

1. 🖱️ Open `index.html` in a modern browser.
2. 👆 Click to start.
3. 💥 Blast globs. Collect space gems 💎. Don't touch the lava 🔥. Don't
   touch the acid 🧪. Don't touch the chargers 🎃.
4. 🏁 At the end of the level, cross into the final screen. The camera
   locks. A flying saucer shows up. 🛸
5. 🔫 Empty your magazine into Greyus Prime until he pops. 💥
6. 🏆 Receive your "Well Done!" screen and **gloat.** 😎

---

## 📁 Project Structure

```
browser_platform_game/
├── 📄 index.html           Entry point — just double-click it
├── 🎨 css/
│   └── style.css           Screens, fonts, layout
└── 📦 js/
    ├── constants.js        ⚙️  ALL tunable game values live here
    ├── input.js            ⌨️  Keyboard + mouse (layout-independent)
    ├── camera.js           📹  Follow camera + arena lock
    ├── physics.js          🧲  Axis-by-axis collision resolution
    ├── level.js            🌱  Tile loader + Mario-style terrain
    ├── player.js           🟢  Space Boy — blob, arms, gun, shooting
    ├── enemies.js          👾  Walker / Charger / Flyer + particles
    ├── gems.js             💎  Collectible space gems
    ├── hud.js              ❤️  Hearts, score, kills, super meter
    ├── validator.js        ✅  Auto-validates level data
    ├── spawner.js          🎲  Generates enemy placements from tiles
    ├── background.js       🌌  Parallax starfield / nebulae / planets
    ├── acidplant.js        🌸  Indestructible acid-spitting obstacles
    ├── boss.js             🛸  Parameterized boss mechanics + renderers
    ├── levels/
    │   └── level1.js       🗺️  Tile data for level 1
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
5. 🎲 **Deterministic worlds.** Stars, flowers, and enemy placements all
   use seeded RNG so the universe is stable between reloads.

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
| 🦋 Spawn more flyers | `ENEMY.SPAWN.FLYERS` |
| 💪 Give the boss more HP | `BOSS_TYPES.alien_saucer.HEALTH` |
| 😈 Make the boss close in | lower `MIN_DISTANCE_FROM_PLAYER` |
| 📏 Change level length | `LEVEL.SCREENS` / `LEVEL.PLAY_SCREENS` |
| 🎨 Recolor everything | every color is a named constant |

---

## 🗺️ Roadmap

- 🚧 **Level 2** *(coming soon!)* — new biome, new enemies, new boss
- 👑 More boss types (robot king 🤖, sentient asteroid ☄️, the usual)
- 🎵 Per-level soundtracks *(the moment an audio file enters the repo, it
  stops being a "just double-click it" game — still deciding if that's
  worth it)*
- 🚩 Checkpoints
- 💾 High scores

---

## 🙌 Credits

- 👨‍💻 Made by **Leigh**, with a slightly excessive amount of iteration.
- 🤖 Built with a lot of help from **Claude Code** (Anthropic's coding agent).
- 👽 **Greyus Prime** has no agent and does not wish to comment at this time.

---

### ⭐ Now go shoot some globs. ⭐
