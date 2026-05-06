(function () {
  const { Config, World, Entities, Interactions } = window.FarmCraft;
  const {
    WIDTH,
    HEIGHT,
    WORLD_HEIGHT,
    TILE_SIZE,
    BLOCKS,
    BLOCK_DEFS,
    PLACEABLE_BLOCKS
  } = Config;

  function draw(state, ctx) {
    drawSky(ctx);
    drawWorld(state, ctx);
    drawCrops(state, ctx);
    drawAnimals(state, ctx);
    drawChicken(state, ctx);
    drawTargetTile(state, ctx);
    drawHotbar(state, ctx);
    drawDayNightOverlay(state, ctx);
    drawWinMessage(state, ctx);
  }

  function drawSky(ctx) {
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  function drawWorld(state, ctx) {
    const startTileX = Math.floor(state.cameraX / TILE_SIZE);
    const endTileX = Math.ceil((state.cameraX + WIDTH) / TILE_SIZE);
    const startTileY = Math.floor(state.cameraY / TILE_SIZE);
    const endTileY = Math.ceil((state.cameraY + HEIGHT) / TILE_SIZE);

    for (let y = startTileY; y < endTileY; y++) {
      if (y < 0 || y >= WORLD_HEIGHT) continue;

      for (let x = startTileX; x < endTileX; x++) {
        if (!World.inWorldBounds(x, y)) continue;
        const block = state.world[y][x];
        if (block !== BLOCKS.AIR) drawBlock(state, ctx, x, y, block);
      }
    }
  }

  function drawBlock(state, ctx, x, y, block) {
    const blockDef = BLOCK_DEFS[block];
    if (!blockDef) return;

    const screenX = x * TILE_SIZE - state.cameraX;
    const screenY = y * TILE_SIZE - state.cameraY;
    if (screenX + TILE_SIZE < 0 || screenX > WIDTH) return;
    if (screenY + TILE_SIZE < 0 || screenY > HEIGHT) return;

    ctx.fillStyle = blockDef.color;
    ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
  }

  function drawCrops(state, ctx) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < Config.WORLD_WIDTH; x++) {
        if (state.world[y][x] !== BLOCKS.FARMLAND) continue;
        const timer = state.cropTimers[y][x];
        if (timer <= 0) continue;

        const stage = Entities.getCropStage(timer);
        const color = stage === 1
          ? "#7CFC00"
          : stage === 2
            ? "#32CD32"
            : stage === 3
              ? "#228B22"
              : "#FFD700";

        const screenX = x * TILE_SIZE - state.cameraX;
        const screenY = y * TILE_SIZE - state.cameraY;
        if (screenX + TILE_SIZE < 0 || screenX > WIDTH) continue;
        if (screenY + TILE_SIZE < 0 || screenY > HEIGHT) continue;

        ctx.fillStyle = color;
        ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      }
    }
  }

  function drawAnimals(state, ctx) {
    for (const animal of state.animals) {
      const screenX = animal.x - state.cameraX;
      const screenY = animal.y - state.cameraY;
      if (screenX + animal.width < 0 || screenX > WIDTH) continue;
      if (screenY + animal.height < 0 || screenY > HEIGHT) continue;

      ctx.fillStyle = animal.color;
      ctx.fillRect(screenX, screenY, animal.width, animal.height);
      ctx.fillStyle = "black";
      ctx.fillRect(screenX + animal.width / 2, screenY + 4, 3, 3);

      if (animal.eggFlashTimer > 0) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(screenX + animal.width / 2, screenY + animal.height + 5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawChicken(state, ctx) {
    const { player } = state;
    const bounce = player.vx !== 0 ? Math.sin(state.timeOfDay * Math.PI * 80) * 2 : 0;
    const screenX = player.x - state.cameraX;
    const screenY = player.y - state.cameraY + bounce;
    const facingRight = player.vx >= 0;
    const beakX = facingRight ? screenX + player.width - 6 : screenX;
    const eyeX = facingRight ? screenX + player.width - 10 : screenX + 7;
    const wingX = facingRight ? screenX + 5 : screenX + player.width - 11;

    // Body
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(screenX, screenY, player.width, player.height);

    // Wing
    ctx.fillStyle = "#e7e7e7";
    ctx.fillRect(wingX, screenY + 11, 9, 10);

    // Beak
    ctx.fillStyle = "#ffa500";
    ctx.fillRect(beakX, screenY + player.height / 2 - 2, 6, 4);

    // Comb
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(screenX + 3, screenY - 3, 4, 4);
    ctx.fillRect(screenX + 6, screenY - 4, 6, 4);

    // Eye
    ctx.fillStyle = "#000000";
    ctx.fillRect(eyeX, screenY + 7, 3, 3);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(eyeX + 1, screenY + 7, 1, 1);

    // Legs
    ctx.fillStyle = "#ffa500";
    ctx.fillRect(screenX + 6, screenY + player.height, 3, 6);
    ctx.fillRect(screenX + player.width - 9, screenY + player.height, 3, 6);
  }

  function drawTargetTile(state, ctx) {
    const { mouseTile } = state;
    if (!World.inWorldBounds(mouseTile.x, mouseTile.y)) return;

    const screenX = mouseTile.x * TILE_SIZE - state.cameraX;
    const screenY = mouseTile.y * TILE_SIZE - state.cameraY;
    if (screenX + TILE_SIZE < 0 || screenX > WIDTH) return;
    if (screenY + TILE_SIZE < 0 || screenY > HEIGHT) return;

    ctx.strokeStyle = Interactions.isWithinReach(state, mouseTile.x, mouseTile.y)
      ? "rgba(255, 255, 255, 0.9)"
      : "rgba(255, 80, 80, 0.85)";
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  }

  function drawHotbar(state, ctx) {
    const barHeight = 40;
    const barWidth = PLACEABLE_BLOCKS.length * 40;
    const xStart = (WIDTH - barWidth) / 2;
    const yStart = HEIGHT - barHeight - 10;

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(xStart - 10, yStart - 10, barWidth + 20, barHeight + 20);

    for (let i = 0; i < PLACEABLE_BLOCKS.length; i++) {
      const slotX = xStart + i * 40;
      const slotY = yStart;
      const block = PLACEABLE_BLOCKS[i];

      ctx.strokeStyle = i === state.selectedBlockIndex ? "yellow" : "white";
      ctx.lineWidth = i === state.selectedBlockIndex ? 3 : 1;
      ctx.strokeRect(slotX, slotY, 32, 32);
      ctx.fillStyle = BLOCK_DEFS[block].color;
      ctx.fillRect(slotX + 4, slotY + 4, 24, 24);
      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.fillText((i + 1).toString(), slotX + 12, slotY + 30);
    }

    ctx.fillStyle = "white";
    ctx.font = "13px Arial";
    ctx.fillText(
      `Selected: ${World.getBlockName(PLACEABLE_BLOCKS[state.selectedBlockIndex])}`,
      xStart - 10,
      yStart - 18
    );
  }

  function drawDayNightOverlay(state, ctx) {
    const angle = state.timeOfDay * 2 * Math.PI;
    const darkness = (Math.cos(angle) + 1) / 2;
    const alpha = darkness * 0.6;

    if (alpha > 0.01) {
      ctx.fillStyle = `rgba(0, 0, 40, ${alpha})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.fillText(`Time: ${darkness > 0.5 ? "Night" : "Day"}`, 10, 20);
    ctx.fillText(`Wheat: ${state.inventory.wheat}`, 10, 40);
    ctx.fillText(`Eggs: ${state.inventory.eggs}`, 10, 60);

    if (state.statusTimer > 0 && state.statusMessage) {
      const width = Math.min(540, state.statusMessage.length * 7 + 20);
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(10, 70, width, 26);
      ctx.fillStyle = "white";
      ctx.fillText(state.statusMessage, 20, 88);
    }
  }

  function drawWinMessage(state, ctx) {
    if (state.inventory.wheat < 100) return;

    const message = "You built a successful farm!";

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(WIDTH / 2 - 210, HEIGHT / 2 - 34, 420, 68);

    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message, WIDTH / 2, HEIGHT / 2 + 8);
    ctx.textAlign = "left";
  }

  window.FarmCraft.Render = {
    draw
  };
})();
