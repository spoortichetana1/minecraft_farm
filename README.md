# Minecraft – Walk in the Park

TRY GAME HERE --> https://spoortichetana1.github.io/minecraft_farm/

A tiny 2D block-based game inspired by Minecraft. Play as a chicken, explore a procedurally generated side-scrolling world, place and break blocks, watch day/night cycles, and grow crops.

---

## ⚙️ Project Overview

This small prototype demonstrates a lightweight, canvas-based 2D block world that simulates basic Minecraft-like mechanics:

- Procedural world generation (height map, stone layers, water ponds, trees)
- Player movement and collision physics
- Block placing & breaking (hotbar with placeable blocks)
- Crops with growth stages
- Simple animals with basic physics
- Day/night cycle (visual overlay)

Files:
- `index.html` — basic HTML host and canvas
- `game.js` — main game logic, world gen, update loop, draw renderer

---

## ▶️ How to run

Option 1 — Open directly (quick):
- Open `index.html` in a modern browser (Google Chrome / Firefox / Edge). Some browsers limit file access but the game should run without a server for local testing.

Option 2 — Run a simple local server (recommended):

- Using Python 3:

```powershell
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

- Using Node (http-server):

```powershell
npx http-server . -p 8000
```

---

## 🎮 Controls

- Move left: `A`
- Move right: `D`
- Jump: `Space`
- Place block: Left mouse button
- Break block: Right mouse button
- Select hotbar slot: `1`–`5`

Note: The player is represented as a small chicken sprite.

---

## ✨ Features & Gameplay

- Procedurally generated 2D side-scrolling tiles (grass, dirt, stone, water)
- Trees and water ponds appear randomly across the world
- Animals (critters) wander with basic physics
- Crop planting via `FARMLAND` block type: starts a growth timer shown with colors
- Day/night cycle overlays the canvas and shows a `Time: Day/Night` label
- Hotbar for placing different types of blocks

---

## 🧭 Configuration / Where to start in code

The main game constants and settings are in `game.js`:

- `WORLD_WIDTH`, `WORLD_HEIGHT` — world tile grid size
- `TILE_SIZE` — size in pixels of each tile (default 16)
- `DAY_SPEED` — increase for faster day/night cycle
- Block types: defined constants (e.g., `BLOCK_GRASS`, `BLOCK_DIRT`, `BLOCK_WOOD`, `BLOCK_FARMLAND`)
- `generateWorld()` — main world generation (height map, stone depth, trees, water)
- `update()`, `draw()` — main game loop functions and rendering

To add blocks, edit `PLACEABLE_BLOCKS` and add a corresponding drawing/color in `drawBlock()` and behavior where needed.

---

## 🛠️ Development Notes

- The physics are basic; collisions are tile-based (solid / not solid). Consider improving edge cases and adding smoother movement/animations.
- No persistent save/load — world state resets on reload.
- The UI is intentionally minimalistic; improvements like textures, better HUD, or sound are left as future work.
- For performance with large worlds, consider chunking and drawing only visible tiles (the current code already calculates visible tile range by camera bounds).

---

## ✅ Contribution

Contributions are welcome! If you'd like to add features or fixes, please do the following:

1. Fork the repository
2. Create a new branch for your feature or fix
3. Send a PR explaining the change

Suggested improvements:
- Add textures or sprite assets
- Implement saving/loading of worlds
- Add UI for inventory and block stacking
- Add sound effects and background music

---

## 📄 License

This project is provided as-is (no explicit license file included in this repo). If you’d like an open-source license, add a `LICENSE` file (MIT is a common choice) or update the README to reflect your preferred license.

---

## Contact

Author: `spoortichetana1` (GitHub)

Have fun exploring and expanding the world! 🐔🌲🌾
