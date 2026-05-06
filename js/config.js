var inventory = { wheat: 0, eggs: 0 };
window.inventory = inventory;

(function () {
  window.FarmCraft = window.FarmCraft || {};

  const BLOCKS = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    WATER: 6,
    FARMLAND: 7
  };

  const BLOCK_DEFS = {
    [BLOCKS.GRASS]: { name: "Grass", color: "#228B22", solid: true },
    [BLOCKS.DIRT]: { name: "Dirt", color: "#8B4513", solid: true },
    [BLOCKS.STONE]: { name: "Stone", color: "#7f7f7f", solid: true },
    [BLOCKS.WOOD]: { name: "Wood", color: "#A0522D", solid: true },
    [BLOCKS.LEAVES]: { name: "Leaves", color: "#4CAF50", solid: true },
    [BLOCKS.WATER]: { name: "Water", color: "#1E90FF", solid: false },
    [BLOCKS.FARMLAND]: { name: "Farmland", color: "#5A3C1A", solid: true }
  };

  window.FarmCraft.Config = {
    WIDTH: 800,
    HEIGHT: 600,
    WORLD_WIDTH: 300,
    WORLD_HEIGHT: 50,
    TILE_SIZE: 16,
    BLOCKS,
    BLOCK_DEFS,
    PLACEABLE_BLOCKS: [
      BLOCKS.GRASS,
      BLOCKS.DIRT,
      BLOCKS.STONE,
      BLOCKS.WOOD,
      BLOCKS.FARMLAND
    ],
    DAY_SPEED: 0.0005,
    GRAVITY: 0.5,
    MAX_FALL_SPEED: 14,
    INTERACTION_RANGE_TILES: 5
  };
})();
