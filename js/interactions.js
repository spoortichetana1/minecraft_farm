(function () {
  const { Config, World, State, Entities } = window.FarmCraft;
  const { TILE_SIZE, BLOCKS, PLACEABLE_BLOCKS } = Config;
  const INTERACTION_RANGE = Config.INTERACTION_RANGE_TILES * TILE_SIZE;

  function isWithinReach(state, tileX, tileY) {
    const playerCenterX = state.player.x + state.player.width / 2;
    const playerCenterY = state.player.y + state.player.height / 2;
    const blockCenterX = tileX * TILE_SIZE + TILE_SIZE / 2;
    const blockCenterY = tileY * TILE_SIZE + TILE_SIZE / 2;

    return Math.hypot(blockCenterX - playerCenterX, blockCenterY - playerCenterY) <= INTERACTION_RANGE;
  }

  function isOverlappingPlayer(state, tileX, tileY) {
    const px1 = state.player.x;
    const px2 = state.player.x + state.player.width;
    const py1 = state.player.y;
    const py2 = state.player.y + state.player.height;
    const bx1 = tileX * TILE_SIZE;
    const bx2 = bx1 + TILE_SIZE;
    const by1 = tileY * TILE_SIZE;
    const by2 = by1 + TILE_SIZE;

    return !(px2 <= bx1 || px1 >= bx2 || py2 <= by1 || py1 >= by2);
  }

  function breakBlock(state, tileX, tileY) {
    if (!World.inWorldBounds(tileX, tileY)) return;
    if (!isWithinReach(state, tileX, tileY)) {
      State.setStatus(state, "Too far away");
      return;
    }
    if (state.world[tileY][tileX] === BLOCKS.AIR) return;
    if (isOverlappingPlayer(state, tileX, tileY)) return;

    const block = state.world[tileY][tileX];
    state.world[tileY][tileX] = BLOCKS.AIR;
    state.cropTimers[tileY][tileX] = 0;
    State.setStatus(state, `Broke ${World.getBlockName(block)}`);
  }

  function harvestCrop(state, tileX, tileY) {
    if (!World.inWorldBounds(tileX, tileY)) return false;
    if (!isWithinReach(state, tileX, tileY)) return false;
    if (state.world[tileY][tileX] !== BLOCKS.FARMLAND) return false;

    const stage = Entities.getCropStage(state.cropTimers[tileY][tileX]);
    if (stage !== 4) return false;

    state.cropTimers[tileY][tileX] = 0;
    state.inventory.wheat++;
    window.FarmCraft.Api.saveGameState(state.inventory);
    State.setStatus(state, "Harvested wheat");
    return true;
  }

  function placeBlock(state, tileX, tileY) {
    if (!World.inWorldBounds(tileX, tileY)) return;
    if (!isWithinReach(state, tileX, tileY)) {
      State.setStatus(state, "Too far away");
      return;
    }
    if (state.world[tileY][tileX] !== BLOCKS.AIR) return;
    if (isOverlappingPlayer(state, tileX, tileY)) return;

    const blockToPlace = PLACEABLE_BLOCKS[state.selectedBlockIndex];
    state.world[tileY][tileX] = blockToPlace;
    state.cropTimers[tileY][tileX] = blockToPlace === BLOCKS.FARMLAND ? 1 : 0;
    State.setStatus(state, `Placed ${World.getBlockName(blockToPlace)}`);
  }

  window.FarmCraft.Interactions = {
    breakBlock,
    harvestCrop,
    placeBlock,
    isWithinReach
  };
})();
