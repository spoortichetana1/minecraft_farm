const SAVE_KEY = "survivorcraft-save-v1";
const AUTO_SAVE_SECONDS = 30;

function getPlayerState(player) {
  return {
    x: player.mesh.position.x,
    y: player.mesh.position.y,
    z: player.mesh.position.z,
    rotationY: player.mesh.rotation.y,
    hunger: player.hunger.getState()
  };
}

function loadPlayerState(player, terrain, playerState) {
  if (!playerState) return;

  const x = Number(playerState.x);
  const z = Number(playerState.z);
  const rotationY = Number(playerState.rotationY);

  if (!Number.isFinite(x) || !Number.isFinite(z)) return;

  player.mesh.position.set(x, terrain.getHeight(x, z) + 0.05, z);
  if (Number.isFinite(rotationY)) {
    player.mesh.rotation.y = rotationY;
  }
  player.hunger.setValue(playerState.hunger?.currentHunger);
}

export function createSaveSystem(context) {
  let autoSaveTimer = AUTO_SAVE_SECONDS;

  function saveGame() {
    const saveData = {
      version: 1,
      savedAt: Date.now(),
      player: getPlayerState(context.player),
      inventory: context.inventory.getState(),
      placedBlocks: context.building.getState()
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    context.hud.setStatus("Game saved");
    return saveData;
  }

  function loadGame() {
    const rawSave = localStorage.getItem(SAVE_KEY);
    if (!rawSave) {
      context.hud.setStatus("No saved game found");
      return false;
    }

    try {
      const saveData = JSON.parse(rawSave);

      context.inventory.setItems(saveData.inventory);
      loadPlayerState(context.player, context.terrain, saveData.player);
      context.terrain.update(context.player.mesh.position);
      context.building.loadState(saveData.placedBlocks);
      context.hud.setStatus("Game loaded");
      return true;
    } catch (error) {
      console.error("Failed to load save", error);
      context.hud.setStatus("Save file could not be loaded");
      return false;
    }
  }

  return {
    saveGame,
    loadGame,
    update(deltaTime) {
      autoSaveTimer -= deltaTime;

      if (autoSaveTimer > 0) return;

      saveGame();
      autoSaveTimer = AUTO_SAVE_SECONDS;
    }
  };
}
