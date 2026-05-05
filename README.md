# Minecraft – Walk in the Park

TRY GAME HERE --> https://spoortichetana1.github.io/minecraft_farm/

A tiny 2D block-based browser game inspired by Minecraft. You play as a chicken, explore a procedurally generated side-scrolling world, place and break blocks, grow crops, and harvest wheat.

## Features

- Procedural terrain with hills, dirt, stone, ponds, and trees.
- Player movement with tile collision, jumping, and camera follow.
- Reach-limited block placing and breaking.
- Hotbar block selection for grass, dirt, stone, wood, and farmland.
- Crop growth on farmland, with harvest and auto-replant behavior.
- Simple wandering animals that avoid walls and ledges.
- Day/night overlay, target tile highlight, status messages, and wheat counter.

## Controls

- Move: `A` / `D` or arrow keys
- Jump: `Space` or `ArrowUp`
- Select block: `1` through `5`
- Place block: left mouse button
- Break block or harvest crop: right mouse button

The highlighted target tile is white when it is within reach and red when it is too far away.

## Run

Open `index.html` directly in a modern browser, or serve the folder locally:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Code Layout

- `index.html` hosts the canvas and basic page styling.
- `game.js` contains world generation, entity updates, rendering, input, and block interactions.

Useful constants in `game.js`:

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