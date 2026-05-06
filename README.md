# FarmCraft 3D

A browser-based 3D farming world built with Three.js. The old 2D canvas version has been removed; the 3D version is now the main app.

## Features

- Hilly green terrain with vertex color variation.
- Minecraft-style grass and dirt block patch.
- Third-person stickman player.
- WASD player movement with mouse-look camera follow.
- Health, respawn, and inventory state.
- Tree resources that can be chopped for wood.
- Day/night lighting cycle.
- Night-only shadow monsters that chase and damage the player.
- Moving animals with simple wandering behavior.
- Wildflowers scattered across the terrain.
- Ambient light, sun light, and shadows.
- Small JavaScript backend for serving the app and health/info endpoints.

## Controls

- Click the screen to capture the mouse.
- Move: `W`, `A`, `S`, `D`
- Look around: mouse movement
- Interact / attack: left mouse click

## Run

Use the JavaScript backend:

```powershell
npm start
```

Then open:

```text
http://localhost:3000
```

You can also serve the `frontend/` folder with any static server. Because the app uses JavaScript modules and a CDN import for Three.js, use `http://` instead of opening `frontend/index.html` directly from `file://`.

## Code Layout

- `frontend/index.html` loads the 3D app.
- `frontend/main.js` bootstraps the app and starts the render loop.
- `frontend/rendering/` creates the Three.js scene, renderer, camera, and lighting.
- `frontend/world/` owns terrain height, block patches, trees, rocks, and resource collection.
- `frontend/player/` owns the stickman, movement, health, damage, and respawn.
- `frontend/entities/` owns animals and night monsters.
- `frontend/systems/` owns input, inventory, time, and loop-level systems.
- `frontend/ui/` owns HUD updates and player feedback.
- `frontend/styles.css` contains fullscreen page and HUD styling.
- `backend/server.js` serves files from `frontend/` and exposes small REST endpoints.
- `design/game-design.md` keeps the project design notes.

## Backend API

- `GET /api/health` checks backend status.
- `GET /api/game-info` returns app route info.
- `GET /api/game-state` returns the current in-memory game state.
- `POST /api/game-state` updates the current in-memory game state.

The REST state API is intentionally not used by the current gameplay loop yet; it remains available for a future save system.

## Development Notes

- The app has no build step and no npm runtime dependencies.
- Three.js is loaded from a CDN in `main.js`.
- The backend state is in memory and resets when the server restarts.
- Movement currently has no collision or physics.
- Farming crops are intentionally deferred until wood, inventory, day/night, monsters, and health are stable.
