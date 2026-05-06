(function () {
  const { Config } = window.FarmCraft;
  const { BLOCKS, BLOCK_DEFS, WORLD_WIDTH, WORLD_HEIGHT } = Config;

  function generateWorld() {
    const world = [];
    const heightMap = [];
    const baseHeight = 30;
    const hillAmplitude = 4;
    const hillFrequency = 0.08;

    for (let x = 0; x < WORLD_WIDTH; x++) {
      const height = baseHeight + Math.round(
        Math.sin(x * hillFrequency) * hillAmplitude + (Math.random() * 2 - 1)
      );
      heightMap.push(height);
    }

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < WORLD_WIDTH; x++) {
        if (y > heightMap[x]) row.push(BLOCKS.DIRT);
        else if (y === heightMap[x]) row.push(BLOCKS.GRASS);
        else row.push(BLOCKS.AIR);
      }
      world.push(row);
    }

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        if (y > heightMap[x] + 5) {
          world[y][x] = BLOCKS.STONE;
        }
      }
    }

    addWaterPonds(world, heightMap);
    addTrees(world, heightMap);

    return { world, heightMap };
  }

  function addWaterPonds(world, heightMap) {
    for (let x = 3; x < WORLD_WIDTH - 3; x++) {
      if (Math.random() >= 0.03) continue;

      const h = heightMap[x];
      for (let dx = 0; dx < 4; dx++) {
        const xx = x + dx;
        for (let dy = 0; dy < 2; dy++) {
          const yy = h + dy;
          if (inWorldBounds(xx, yy)) {
            world[yy][xx] = BLOCKS.WATER;
          }
        }
      }
    }
  }

  function addTrees(world, heightMap) {
    for (let x = 2; x < WORLD_WIDTH - 2; x++) {
      if (Math.random() >= 0.06) continue;

      const groundY = heightMap[x];
      for (let t = 1; t <= 3; t++) {
        if (groundY - t >= 0) world[groundY - t][x] = BLOCKS.WOOD;
      }

      for (let dy = -4; dy <= -2; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const lx = x + dx;
          const ly = groundY + dy;
          if (inWorldBounds(lx, ly) && world[ly][lx] === BLOCKS.AIR) {
            world[ly][lx] = BLOCKS.LEAVES;
          }
        }
      }
    }
  }

  function inWorldBounds(tileX, tileY) {
    return tileX >= 0 && tileY >= 0 && tileX < WORLD_WIDTH && tileY < WORLD_HEIGHT;
  }

  function isSolidBlock(state, tileX, tileY) {
    if (!inWorldBounds(tileX, tileY)) return false;
    return Boolean(BLOCK_DEFS[state.world[tileY][tileX]]?.solid);
  }

  function getBlockName(block) {
    return BLOCK_DEFS[block]?.name ?? "Air";
  }

  window.FarmCraft.World = {
    generateWorld,
    inWorldBounds,
    isSolidBlock,
    getBlockName
  };
})();
