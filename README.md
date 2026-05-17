# SurvivorCraft 3D

A browser-based 3D survival world built with Three.js. The old 2D canvas version has been removed; the 3D version is now the main app.

## Features

- Hilly green terrain with vertex color variation.
- Minecraft-style grass and dirt block patch.
- Third-person stickman player.
- WASD and arrow-key player movement with camera follow based on movement direction.
- Equippable axe tool with a visible hand model and swing animation.
- Health, respawn, and inventory state.
- Tree resources that take several axe hits to chop for wood.
- Wild animals that can be hunted for meat.
- Day/night lighting cycle.
- Night-only shadow monsters that chase and damage the player.
- Moving animals with simple wandering behavior.
- Wildflowers scattered across the terrain.
- Ambient light, sun light, and shadows.
- Small JavaScript backend for serving the app and health/info endpoints.

## Controls

- Move: `W`, `A`, `S`, `D` or arrow keys
- Camera: follows the current movement direction
- Chop nearby trees: single left mouse click
- Hunt nearby animals / collect meat: double left mouse click
- Build protective stone wall: right mouse click
- Trade supplies for health: `Trade Health` button
- Select hotbar item: `1`-`6`

## Run

Use the JavaScript backend:

```powershell
npm start
```

Then open:

```text
http://localhost:3000
```

Run through the JavaScript backend instead of serving `frontend/` directly. The frontend imports gameplay modules from the backend-owned `/game/` route, and JavaScript modules require `http://` rather than opening `frontend/index.html` directly from `file://`.

## Code Layout

- `frontend/index.html` loads the 3D app.
- `frontend/main.js` bootstraps the app, creates the UI-facing rendering context, and starts the render loop.
- `frontend/ui/` owns HUD updates and player feedback.
- `frontend/styles.css` contains fullscreen page and HUD styling.
- `backend/game/` owns gameplay modules for world generation, player behavior, entities, inventory, saving, time, lighting, and audio.
- `backend/server.js` serves files from `frontend/`, serves backend gameplay modules at `/game/`, and exposes small REST endpoints.
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
- Farming crops, seeds, and wheat are out of scope for this survivor-focused game direction.
