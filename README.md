# Minecraft Farm

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

- `WORLD_WIDTH`, `WORLD_HEIGHT`, `TILE_SIZE`
- `DAY_SPEED`
- `PLACEABLE_BLOCKS`
- `INTERACTION_RANGE`

## Improvement Ideas

- Add persistent save/load.
- Add textured sprites or a small asset pipeline.
- Add inventory counts for placed blocks.
- Add sound effects and music.
- Split `game.js` into modules once the game grows beyond a prototype.
