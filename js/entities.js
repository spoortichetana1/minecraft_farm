(function () {
  const { Config, World } = window.FarmCraft;
  const {
    WIDTH,
    HEIGHT,
    WORLD_WIDTH,
    WORLD_PIXEL_WIDTH = Config.WORLD_WIDTH * Config.TILE_SIZE,
    WORLD_PIXEL_HEIGHT = Config.WORLD_HEIGHT * Config.TILE_SIZE,
    TILE_SIZE,
    BLOCKS,
    DAY_SPEED,
    GRAVITY,
    MAX_FALL_SPEED
  } = Config;

  function placePlayerAtSpawn(state) {
    const spawnTileX = 6;
    const groundY = state.heightMap[spawnTileX];
    state.player.x = spawnTileX * TILE_SIZE;
    state.player.y = groundY * TILE_SIZE - state.player.height;
  }

  function update(state) {
    state.timeOfDay += DAY_SPEED;
    if (state.timeOfDay > 1) state.timeOfDay -= 1;

    updatePlayer(state);
    if (state.statusTimer > 0) state.statusTimer--;
    updateCrops(state);
    updateAnimals(state);
    updateCamera(state);
  }

  function updateCamera(state) {
    state.cameraX = state.player.x + state.player.width / 2 - WIDTH / 2;
    if (state.cameraX < 0) state.cameraX = 0;

    const maxCamX = WORLD_PIXEL_WIDTH - WIDTH;
    if (state.cameraX > maxCamX) state.cameraX = maxCamX;
    state.cameraY = 0;
  }

  function updatePlayer(state) {
    const { player, keys } = state;

    if (state.inventory.wheat >= 100) {
      player.vx = 0;
      player.vy = 0;
      return;
    }

    if (keys.KeyA || keys.ArrowLeft) player.vx = -player.speed;
    else if (keys.KeyD || keys.ArrowRight) player.vx = player.speed;
    else player.vx = 0;

    if ((keys.Space || keys.ArrowUp) && !player.jumping) {
      player.vy = -10;
      player.jumping = true;
    }

    player.vy += GRAVITY;
    if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

    movePlayerHorizontally(state);
    movePlayerVertically(state);

    if (player.y > WORLD_PIXEL_HEIGHT) {
      placePlayerAtSpawn(state);
      player.vx = 0;
      player.vy = 0;
      player.jumping = false;
      window.FarmCraft.State.setStatus(state, "Respawned at the farm");
    }
  }

  function movePlayerHorizontally(state) {
    const { player } = state;
    const newX = player.x + player.vx;
    const left = Math.floor(newX / TILE_SIZE);
    const right = Math.floor((newX + player.width - 1) / TILE_SIZE);
    const top = Math.floor(player.y / TILE_SIZE);
    const bottom = Math.floor((player.y + player.height - 1) / TILE_SIZE);

    let blockedX = false;
    for (let y = top; y <= bottom; y++) {
      if (World.isSolidBlock(state, left, y) || World.isSolidBlock(state, right, y)) {
        blockedX = true;
        break;
      }
    }

    if (!blockedX) {
      player.x = Math.max(0, Math.min(newX, WORLD_PIXEL_WIDTH - player.width));
    }
  }

  function movePlayerVertically(state) {
    const { player } = state;
    const newY = player.y + player.vy;
    const top = Math.floor(newY / TILE_SIZE);
    const bottom = Math.floor((newY + player.height - 1) / TILE_SIZE);
    const left = Math.floor(player.x / TILE_SIZE);
    const right = Math.floor((player.x + player.width - 1) / TILE_SIZE);

    let blockedY = false;
    for (let x = left; x <= right; x++) {
      if (World.isSolidBlock(state, x, top) || World.isSolidBlock(state, x, bottom)) {
        blockedY = true;
        break;
      }
    }

    if (!blockedY) {
      player.y = newY;
      return;
    }

    if (player.vy > 0) {
      player.y = bottom * TILE_SIZE - player.height;
      player.jumping = false;
    } else if (player.vy < 0) {
      player.y = (top + 1) * TILE_SIZE;
    }
    player.vy = 0;
  }

  function updateCrops(state) {
    const angle = state.timeOfDay * 2 * Math.PI;
    const darkness = (Math.cos(angle) + 1) / 2;
    const isDay = darkness <= 0.5;
    const baseGrowthSpeed = isDay ? 1.5 : 0.5;

    for (let y = 0; y < Config.WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        if (state.world[y][x] === BLOCKS.FARMLAND && state.cropTimers[y][x] > 0) {
          let growthSpeed = baseGrowthSpeed;

          // Water within 2 tiles helps crops grow faster.
          for (let waterY = y - 2; waterY <= y + 2; waterY++) {
            for (let waterX = x - 2; waterX <= x + 2; waterX++) {
              if (World.inWorldBounds(waterX, waterY) && state.world[waterY][waterX] === BLOCKS.WATER) {
                growthSpeed += 1;
                waterY = y + 3;
                break;
              }
            }
          }

          // cropTimers still drive the existing stage thresholds.
          state.cropTimers[y][x] += growthSpeed;
        }
      }
    }
  }

  function getCropStage(timer) {
    if (timer <= 0) return 0;
    if (timer < 300) return 1;
    if (timer < 600) return 2;
    if (timer < 900) return 3;
    return 4;
  }

  function updateAnimals(state) {
    const eggInterval = 420;

    for (const animal of state.animals) {
      // Each animal owns a simple frame timer. When it reaches the interval,
      // one egg is added and a short visual marker is shown under the animal.
      animal.eggTimer++;
      if (animal.eggTimer >= eggInterval) {
        animal.eggTimer = 0;
        animal.eggFlashTimer = 90;
        state.inventory.eggs++;
        window.FarmCraft.Api.saveGameState(state.inventory);
      }
      if (animal.eggFlashTimer > 0) animal.eggFlashTimer--;

      animal.vy += GRAVITY * 0.5;
      if (animal.vy > MAX_FALL_SPEED) animal.vy = MAX_FALL_SPEED;

      const nextX = animal.x + animal.dir * animal.speed;
      const frontX = animal.dir > 0
        ? Math.floor((nextX + animal.width) / TILE_SIZE)
        : Math.floor(nextX / TILE_SIZE);
      const footY = Math.floor((animal.y + animal.height + 1) / TILE_SIZE);
      const bodyTop = Math.floor(animal.y / TILE_SIZE);
      const bodyBottom = Math.floor((animal.y + animal.height - 1) / TILE_SIZE);
      let shouldTurn = nextX < 0 || nextX + animal.width > WORLD_PIXEL_WIDTH;

      for (let ty = bodyTop; ty <= bodyBottom; ty++) {
        if (World.isSolidBlock(state, frontX, ty)) shouldTurn = true;
      }
      if (!World.isSolidBlock(state, frontX, footY)) shouldTurn = true;

      animal.x = shouldTurn
        ? animal.x + -animal.dir * animal.speed
        : nextX;
      if (shouldTurn) animal.dir *= -1;

      moveAnimalVertically(state, animal);
    }
  }

  function moveAnimalVertically(state, animal) {
    const newY = animal.y + animal.vy;
    const left = Math.floor(animal.x / TILE_SIZE);
    const right = Math.floor((animal.x + animal.width - 1) / TILE_SIZE);
    const bottom = Math.floor((newY + animal.height - 1) / TILE_SIZE);

    let blockedY = false;
    for (let tx = left; tx <= right; tx++) {
      if (World.isSolidBlock(state, tx, bottom)) {
        blockedY = true;
        break;
      }
    }

    if (!blockedY) {
      animal.y = newY;
    } else {
      animal.y = bottom * TILE_SIZE - animal.height;
      animal.vy = 0;
    }
  }

  window.FarmCraft.Entities = {
    placePlayerAtSpawn,
    update,
    getCropStage
  };
})();
