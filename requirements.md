# Space Boy! — Requirements

## Overview
"Space Boy!" is a side-scrolling platform shooter inspired by classic 2D Duke Nukem and Mario.
Built as a browser game using HTML5 Canvas and vanilla JavaScript.

---

## Tech Stack
- HTML5 + Canvas for rendering
- Vanilla CSS for UI styling
- Vanilla JavaScript (ES6 modules), no frameworks
- Lightweight open-source libs (e.g. jQuery) only if absolutely necessary
- All tunable values parameterized in `constants.js`
- Modular file structure: separated HTML, CSS, and JS

---

## Player Character
- Rendered as a simple shape (placeholder for now)
- Faces the direction of last movement (left or right)
- Has a "space gun" that points toward the mouse cursor (full 360°)
- **Health:** 3 hit points, displayed as hearts above the character's head
- On death (0 HP): level restarts
- On falling into lava: instant death (full HP loss), level restarts

## Controls
| Action         | Input              | Notes |
|----------------|--------------------|-------|
| Move left      | A key              | |
| Move right     | D key              | |
| Jump           | Right Mouse Button | Leap forward when moving, straight up when still. Player can steer while airborne. |
| Shoot          | Left Mouse Button  | Fires toward mouse cursor. One shot kills any enemy. |
| Aim            | Mouse movement     | Gun rotates 360° to follow cursor position |

---

## Enemies
All enemies are killed in one shot. Each kill awards **10 points**.

### Walker
- Patrols left-to-right on a platform (like classic Mario Goomba)
- Reverses direction at platform edges or walls
- Damages player on contact

### Charger
- Idles until the player enters its line of sight
- Charges toward the player at increased speed once triggered
- Damages player on contact

### Flyer
- Moves through the air (not bound to platforms)
- Follows a patrol pattern or hovers in an area
- Damages player on contact

---

## Collectibles

### Space Gems
- Scattered throughout levels
- Player collects by touching them
- Total collected count displayed in the HUD
- (Future: will have gameplay significance — TBD)

---

## Level Design
- Levels are **static** (hand-designed, not procedurally generated)
- Current scope: **1 level**, 4 camera-widths long
- Future scope: 8 camera-widths per level, multiple levels
- Features:
  - Platforms / ledges to jump onto
  - Lava pits to jump over (instant death)
  - Enemy placements
  - Space gem placements
- Tile-based grid system for level construction

### Level Design Rules (enforced by validator)

All rules are derived from physics constants — changing jump velocity, gravity, etc.
automatically updates the limits.

| Constraint | Current Value | Derived From |
|---|---|---|
| Max jump height | 2 tiles (90 px) | JUMP_VELOCITY² / (2 × GRAVITY) |
| Max jump distance | 3 tiles (106 px) | AIR_SPEED × AIR_TIME + leap boost |

1. **Platform reachability:** Every platform must be reachable from at least one other
   standing surface via a jump of ≤ max height and ≤ max distance. Platforms higher than
   the max jump height are allowed only if intermediate stepping-stone platforms exist.
2. **Lava gap width:** No lava gap may be wider than the max jump distance (3 tiles),
   unless platforms above the gap provide a crossing path.
3. **Gems not in solids:** Space gems must never be placed inside solid tiles.
4. **Enemy grounding:** Ground-based enemies (walkers, chargers) must be placed on tiles
   that have solid ground directly below them. Flyers are exempt.

### Level Validator
- Located at `js/validator.js`
- Run from browser console: `SpaceBoy.validateLevel(SpaceBoy.level1Data)`
- Outputs PASS/FAIL per rule with specific issue descriptions
- Should be run after any level data changes

## Camera
- Follows the player horizontally (Mario-style smooth follow)
- Continuous scrolling (no screen-by-screen transitions)
- Clamped to level boundaries (no showing beyond level edges)

---

## HUD / UI
- **Hearts:** 3 heart icons above the player character (not on screen HUD)
- **Score:** Displayed on screen — increments by 10 per enemy killed
- **Gems:** Count of collected space gems displayed on screen
- **Game title:** "Space Boy!" shown on start/death screen

---

## Future Plans (not in current scope)
- Boss enemies on the final screen of a level
- Multiple levels with increasing difficulty
- Pixel art sprites replacing placeholder shapes
- Thematic ending sequence
- Sound effects and music
- More collectible types / power-ups
