const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;   // 800
const HEIGHT = canvas.height; // 600

// ===== World config =====
const WORLD_WIDTH = 300;  // much wider world (300 tiles)
const WORLD_HEIGHT = 50;
const TILE_SIZE = 16;

const WORLD_PIXEL_WIDTH = WORLD_WIDTH * TILE_SIZE;
const WORLD_PIXEL_HEIGHT = WORLD_HEIGHT * TILE_SIZE;

// ===== Block types =====
const BLOCK_AIR      = 0;
const BLOCK_GRASS    = 1;
const BLOCK_DIRT     = 2;
const BLOCK_STONE    = 3;
const BLOCK_WOOD     = 4;
const BLOCK_LEAVES   = 5;
const BLOCK_WATER    = 6;
const BLOCK_FARMLAND = 7;

// What the player can place (hotbar)
const PLACEABLE_BLOCKS = [
  BLOCK_GRASS,
  BLOCK_DIRT,
  BLOCK_STONE,
  BLOCK_WOOD,
  BLOCK_FARMLAND // farmland for crops
];

const BLOCK_DEFS = {
  [BLOCK_GRASS]: { name: "Grass", color: "#228B22", solid: true },
  [BLOCK_DIRT]: { name: "Dirt", color: "#8B4513", solid: true },
  [BLOCK_STONE]: { name: "Stone", color: "#7f7f7f", solid: true },
  [BLOCK_WOOD]: { name: "Wood", color: "#A0522D", solid: true },
  [BLOCK_LEAVES]: { name: "Leaves", color: "#4CAF50", solid: true },
  [BLOCK_WATER]: { name: "Water", color: "#1E90FF", solid: false },
  [BLOCK_FARMLAND]: { name: "Farmland", color: "#5A3C1A", solid: true }
};

let selectedBlockIndex = 0;

// ===== Crops (growth timers) =====
let cropTimers = Array.from({ length: WORLD_HEIGHT }, () =>
  Array(WORLD_WIDTH).fill(0)
);

// ===== Day / Night cycle =====
let timeOfDay = 0;         // 0..1
const DAY_SPEED = 0.0005;

// ===== Camera (world -> screen) =====
let cameraX = 0;
let cameraY = 0; // we keep Y mostly fixed for now

let wheat = 0;
let statusMessage = "A/D move, Space jump, 1-5 select, LMB place, RMB break";
let statusTimer = 240;
let mouseTile = { x: -1, y: -1 };

function updateCamera() {
  // center camera on player horizontally
  cameraX = player.x + player.width / 2 - WIDTH / 2;

  // clamp so we don't scroll beyond world edges
  if (cameraX < 0) cameraX = 0;
  const maxCamX = WORLD_PIXEL_WIDTH - WIDTH;
  if (cameraX > maxCamX) cameraX = maxCamX;

  // vertical camera fixed at 0 (we see sky + ground)
  cameraY = 0;
}

// ===== World generation =====
function generateWorld() {
  let world = [];
  let heightMap = [];

  const baseHeight = 30;
  const hillAmplitude = 4;
  const hillFrequency = 0.08; // gentler, slower hills across large world

  for (let x = 0; x < WORLD_WIDTH; x++) {
    const height =
      baseHeight +
      Math.round(
        Math.sin(x * hillFrequency) * hillAmplitude +
        (Math.random() * 2 - 1)
      );
    heightMap.push(height);
  }

  // Fill with air / grass / dirt
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    let row = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y > heightMap[x]) row.push(BLOCK_DIRT);
      else if (y === heightMap[x]) row.push(BLOCK_GRASS);
      else row.push(BLOCK_AIR);
    }
    world.push(row);
  }

  // Stone deeper
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (y > heightMap[x] + 5) {
        world[y][x] = BLOCK_STONE;
      }
    }
  }

  // Water ponds
  for (let x = 3; x < WORLD_WIDTH - 3; x++) {
    if (Math.random() < 0.03) {
      const h = heightMap[x];
      for (let dx = 0; dx < 4; dx++) {
        const xx = x + dx;
        for (let dy = 0; dy < 2; dy++) {
          const yy = h + dy;
          if (yy >= 0 && yy < WORLD_HEIGHT && xx >= 0 && xx < WORLD_WIDTH) {
            world[yy][xx] = BLOCK_WATER;
          }
        }
      }
    }
  }

  // Trees scattered
  for (let x = 2; x < WORLD_WIDTH - 2; x++) {
    if (Math.random() < 0.06) {
      const groundY = heightMap[x];

      // trunk
      for (let t = 1; t <= 3; t++) {
        if (groundY - t >= 0) world[groundY - t][x] = BLOCK_WOOD;
      }

      // leaves
      for (let dy = -4; dy <= -2; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const lx = x + dx;
          const ly = groundY + dy;
          if (lx >= 0 && lx < WORLD_WIDTH && ly >= 0 && ly < WORLD_HEIGHT) {
            if (world[ly][lx] === BLOCK_AIR) {
              world[ly][lx] = BLOCK_LEAVES;
            }
          }
        }
      }
    }
  }

  return { world, heightMap };
}

let { world, heightMap } = generateWorld();

// ===== Player (chicken) =====
let player = {
  x: 100,
  y: 100,
  width: 28,
  height: 28,
  vx: 0,
  vy: 0,
  speed: 3,
  jumping: false
};

const GRAVITY = 0.5;
const MAX_FALL_SPEED = 14;
const INTERACTION_RANGE = 5 * TILE_SIZE;

function placePlayerAtSpawn() {
  const spawnTileX = 6;
  const groundY = heightMap[spawnTileX];
  player.x = spawnTileX * TILE_SIZE;
  player.y = groundY * TILE_SIZE - player.height;
}

placePlayerAtSpawn();

// ===== Animals (optional extra critters) =====
let animals = [
  { x: 600, y: 0, width: 24, height: 20, vx: 0, vy: 0, speed: 1, dir: 1, color: "#ffcc99" },
  { x: 1200, y: 0, width: 24, height: 20, vx: 0, vy: 0, speed: 1, dir: -1, color: "#ffffff" }
];

// ===== Input =====
let keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.code] = true;

  if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(e.code)) {
    e.preventDefault();
  }

  // hotbar 1-5
  if (e.code === "Digit1") selectedBlockIndex = 0;
  if (e.code === "Digit2") selectedBlockIndex = 1;
  if (e.code === "Digit3") selectedBlockIndex = 2;
  if (e.code === "Digit4") selectedBlockIndex = 3;
  if (e.code === "Digit5") selectedBlockIndex = 4;
});

document.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// ===== Helpers =====
function isSolidBlock(x, y) {
  if (x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) return false;
  return Boolean(BLOCK_DEFS[world[y][x]]?.solid);
}

function setStatus(message, duration = 120) {
  statusMessage = message;
  statusTimer = duration;
}

function inWorldBounds(tileX, tileY) {
  return tileX >= 0 && tileY >= 0 && tileX < WORLD_WIDTH && tileY < WORLD_HEIGHT;
}

function isWithinReach(tileX, tileY) {
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;
  const blockCenterX = tileX * TILE_SIZE + TILE_SIZE / 2;
  const blockCenterY = tileY * TILE_SIZE + TILE_SIZE / 2;
  return Math.hypot(blockCenterX - playerCenterX, blockCenterY - playerCenterY) <= INTERACTION_RANGE;
}

function getBlockName(block) {
  return BLOCK_DEFS[block]?.name ?? "Air";
}

function updateCrops() {
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (world[y][x] === BLOCK_FARMLAND && cropTimers[y][x] > 0) {
        cropTimers[y][x]++;
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

function updateAnimals() {
  for (const a of animals) {
    // gravity
    a.vy += GRAVITY * 0.5;
    if (a.vy > MAX_FALL_SPEED) a.vy = MAX_FALL_SPEED;

    // horizontal wander
    const nextX = a.x + a.dir * a.speed;
    const frontX = a.dir > 0
      ? Math.floor((nextX + a.width) / TILE_SIZE)
      : Math.floor(nextX / TILE_SIZE);
    const footY = Math.floor((a.y + a.height + 1) / TILE_SIZE);
    const bodyTop = Math.floor(a.y / TILE_SIZE);
    const bodyBottom = Math.floor((a.y + a.height - 1) / TILE_SIZE);
    let shouldTurn = nextX < 0 || nextX + a.width > WORLD_PIXEL_WIDTH;

    for (let ty = bodyTop; ty <= bodyBottom; ty++) {
      if (isSolidBlock(frontX, ty)) shouldTurn = true;
    }
    if (!isSolidBlock(frontX, footY)) shouldTurn = true;

    let newX = nextX;
    if (shouldTurn) {
      a.dir *= -1;
      newX = a.x + a.dir * a.speed;
    }
    a.x = newX;

    // vertical collision
    let newY = a.y + a.vy;
    const left   = Math.floor(a.x / TILE_SIZE);
    const right  = Math.floor((a.x + a.width - 1) / TILE_SIZE);
    const bottom = Math.floor((newY + a.height - 1) / TILE_SIZE);

    let blockedY = false;
    for (let tx = left; tx <= right; tx++) {
      if (isSolidBlock(tx, bottom)) {
        blockedY = true;
        break;
      }
    }

    if (!blockedY) {
      a.y = newY;
    } else {
      a.y = bottom * TILE_SIZE - a.height;
      a.vy = 0;
    }
  }
}

// ===== Update =====
function update() {
  // time (day/night)
  timeOfDay += DAY_SPEED;
  if (timeOfDay > 1) timeOfDay -= 1;

  // horizontal input
  if (keys["KeyA"] || keys["ArrowLeft"])      player.vx = -player.speed;
  else if (keys["KeyD"] || keys["ArrowRight"]) player.vx =  player.speed;
  else                   player.vx = 0;

  // jump
  if ((keys["Space"] || keys["ArrowUp"]) && !player.jumping) {
    player.vy = -10;
    player.jumping = true;
  }

  // gravity
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

  if (statusTimer > 0) statusTimer--;

  // horizontal movement + collision
  let newX = player.x + player.vx;
  let left   = Math.floor(newX / TILE_SIZE);
  let right  = Math.floor((newX + player.width - 1) / TILE_SIZE);
  let top    = Math.floor(player.y / TILE_SIZE);
  let bottom = Math.floor((player.y + player.height - 1) / TILE_SIZE);

  let blockedX = false;
  for (let y = top; y <= bottom; y++) {
    if (isSolidBlock(left, y) || isSolidBlock(right, y)) {
      blockedX = true;
      break;
    }
  }
  if (!blockedX) {
    player.x = Math.max(0, Math.min(newX, WORLD_PIXEL_WIDTH - player.width));
  }

  // vertical movement + collision
  let newY = player.y + player.vy;
  top    = Math.floor(newY / TILE_SIZE);
  bottom = Math.floor((newY + player.height - 1) / TILE_SIZE);
  left   = Math.floor(player.x / TILE_SIZE);
  right  = Math.floor((player.x + player.width - 1) / TILE_SIZE);

  let blockedY = false;
  for (let x = left; x <= right; x++) {
    if (isSolidBlock(x, top) || isSolidBlock(x, bottom)) {
      blockedY = true;
      break;
    }
  }

  if (!blockedY) {
    player.y = newY;
  } else {
    if (player.vy > 0) {
      player.y = bottom * TILE_SIZE - player.height;
      player.jumping = false;
    } else if (player.vy < 0) {
      player.y = (top + 1) * TILE_SIZE;
    }
    player.vy = 0;
  }

  if (player.y > WORLD_PIXEL_HEIGHT) {
    placePlayerAtSpawn();
    player.vx = 0;
    player.vy = 0;
    player.jumping = false;
    setStatus("Respawned at the farm");
  }

  // crops & animals
  updateCrops();
  updateAnimals();

  // update camera last
  updateCamera();
}

// ===== Drawing =====
function drawBlock(x, y, block) {
  const blockDef = BLOCK_DEFS[block];
  if (!blockDef) return;
  ctx.fillStyle = blockDef.color;

  const screenX = x * TILE_SIZE - cameraX;
  const screenY = y * TILE_SIZE - cameraY;

  // only draw if on-screen
  if (screenX + TILE_SIZE < 0 || screenX > WIDTH) return;
  if (screenY + TILE_SIZE < 0 || screenY > HEIGHT) return;

  ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
}

function drawHotbar() {
  const barHeight = 40;
  const barWidth = PLACEABLE_BLOCKS.length * 40;
  const xStart = (WIDTH - barWidth) / 2;
  const yStart = HEIGHT - barHeight - 10;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(xStart - 10, yStart - 10, barWidth + 20, barHeight + 20);

  for (let i = 0; i < PLACEABLE_BLOCKS.length; i++) {
    const slotX = xStart + i * 40;
    const slotY = yStart;

    ctx.strokeStyle = (i === selectedBlockIndex) ? "yellow" : "white";
    ctx.lineWidth = (i === selectedBlockIndex) ? 3 : 1;
    ctx.strokeRect(slotX, slotY, 32, 32);

    const block = PLACEABLE_BLOCKS[i];
    ctx.fillStyle = BLOCK_DEFS[block].color;
    ctx.fillRect(slotX + 4, slotY + 4, 24, 24);

    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText((i + 1).toString(), slotX + 12, slotY + 30);
  }

  ctx.fillStyle = "white";
  ctx.font = "13px Arial";
  ctx.fillText(
    `Selected: ${getBlockName(PLACEABLE_BLOCKS[selectedBlockIndex])}`,
    xStart - 10,
    yStart - 18
  );
}

function drawCrops() {
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let x = 0; x < WORLD_WIDTH; x++) {
      if (world[y][x] !== BLOCK_FARMLAND) continue;
      const timer = cropTimers[y][x];
      if (timer <= 0) continue;

      const stage = getCropStage(timer);
      let color;
      if (stage === 1) color = "#7CFC00";
      else if (stage === 2) color = "#32CD32";
      else if (stage === 3) color = "#228B22";
      else color = "#FFD700";

      const screenX = x * TILE_SIZE - cameraX;
      const screenY = y * TILE_SIZE - cameraY;
      const margin = 4;

      if (screenX + TILE_SIZE < 0 || screenX > WIDTH) continue;
      if (screenY + TILE_SIZE < 0 || screenY > HEIGHT) continue;

      ctx.fillStyle = color;
      ctx.fillRect(
        screenX + margin,
        screenY + margin,
        TILE_SIZE - 2 * margin,
        TILE_SIZE - 2 * margin
      );
    }
  }
}

function drawAnimals() {
  for (const a of animals) {
    const screenX = a.x - cameraX;
    const screenY = a.y - cameraY;

    if (screenX + a.width < 0 || screenX > WIDTH) continue;
    if (screenY + a.height < 0 || screenY > HEIGHT) continue;

    ctx.fillStyle = a.color;
    ctx.fillRect(screenX, screenY, a.width, a.height);
    ctx.fillStyle = "black";
    ctx.fillRect(screenX + a.width / 2, screenY + 4, 3, 3);
  }
}

function drawDayNightOverlay() {
  const angle = timeOfDay * 2 * Math.PI;
  const darkness = (Math.cos(angle) + 1) / 2;
  const alpha = darkness * 0.6;

  if (alpha > 0.01) {
    ctx.fillStyle = `rgba(0, 0, 40, ${alpha})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  const label = darkness > 0.5 ? "Night" : "Day";
  ctx.fillText(`Time: ${label}`, 10, 20);
  ctx.fillText(`Wheat: ${wheat}`, 10, 40);

  if (statusTimer > 0 && statusMessage) {
    const width = Math.min(540, statusMessage.length * 7 + 20);
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(10, 50, width, 26);
    ctx.fillStyle = "white";
    ctx.fillText(statusMessage, 20, 68);
  }
}

function drawTargetTile() {
  if (!inWorldBounds(mouseTile.x, mouseTile.y)) return;

  const screenX = mouseTile.x * TILE_SIZE - cameraX;
  const screenY = mouseTile.y * TILE_SIZE - cameraY;
  if (screenX + TILE_SIZE < 0 || screenX > WIDTH) return;
  if (screenY + TILE_SIZE < 0 || screenY > HEIGHT) return;

  ctx.strokeStyle = isWithinReach(mouseTile.x, mouseTile.y)
    ? "rgba(255, 255, 255, 0.9)"
    : "rgba(255, 80, 80, 0.85)";
  ctx.lineWidth = 2;
  ctx.strokeRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
}

// Draw player as a "chicken"
function drawChicken() {
  const screenX = player.x - cameraX;
  const screenY = player.y - cameraY;

  // Body
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(screenX, screenY, player.width, player.height);

  // Beak
  ctx.fillStyle = "#ffa500";
  ctx.fillRect(screenX + player.width - 6, screenY + player.height / 2 - 2, 6, 4);

  // Comb (red on top)
  ctx.fillStyle = "#ff0000";
  ctx.fillRect(screenX + 6, screenY - 4, 6, 4);

  // Eye
  ctx.fillStyle = "#000000";
  ctx.fillRect(screenX + player.width - 10, screenY + 6, 3, 3);

  // Legs
  ctx.fillStyle = "#ffa500";
  ctx.fillRect(screenX + 6, screenY + player.height, 3, 6);
  ctx.fillRect(screenX + player.width - 9, screenY + player.height, 3, 6);
}

function draw() {
  // sky
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // visible tile range based on camera
  const startTileX = Math.floor(cameraX / TILE_SIZE);
  const endTileX = Math.ceil((cameraX + WIDTH) / TILE_SIZE);
  const startTileY = Math.floor(cameraY / TILE_SIZE);
  const endTileY = Math.ceil((cameraY + HEIGHT) / TILE_SIZE);

  // world
  for (let y = startTileY; y < endTileY; y++) {
    if (y < 0 || y >= WORLD_HEIGHT) continue;
    for (let x = startTileX; x < endTileX; x++) {
      if (x < 0 || x >= WORLD_WIDTH) continue;
      const block = world[y][x];
      if (block !== BLOCK_AIR) drawBlock(x, y, block);
    }
  }

  // crops & animals
  drawCrops();
  drawAnimals();

  // player (chicken)
  drawChicken();

  // UI overlays
  drawTargetTile();
  drawHotbar();
  drawDayNightOverlay();
}

// ===== Game loop =====
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// ===== Block placing / breaking =====
function isOverlappingPlayer(tileX, tileY) {
  const px1 = player.x,               px2 = player.x + player.width;
  const py1 = player.y,               py2 = player.y + player.height;
  const bx1 = tileX * TILE_SIZE,      bx2 = bx1 + TILE_SIZE;
  const by1 = tileY * TILE_SIZE,      by2 = by1 + TILE_SIZE;
  return !(px2 <= bx1 || px1 >= bx2 || py2 <= by1 || py1 >= by2);
}

function breakBlock(tileX, tileY) {
  if (!inWorldBounds(tileX, tileY)) return;
  if (!isWithinReach(tileX, tileY)) {
    setStatus("Too far away");
    return;
  }
  if (world[tileY][tileX] === BLOCK_AIR) return;
  if (isOverlappingPlayer(tileX, tileY)) return;

  const block = world[tileY][tileX];
  if (block === BLOCK_FARMLAND && cropTimers[tileY][tileX] > 0) {
    const stage = getCropStage(cropTimers[tileY][tileX]);
    if (stage >= 4) {
      wheat++;
      cropTimers[tileY][tileX] = 1;
      setStatus("Harvested wheat and replanted");
      return;
    }
    cropTimers[tileY][tileX] = 0;
    setStatus("Removed young crop");
    return;
  }

  world[tileY][tileX] = BLOCK_AIR;
  cropTimers[tileY][tileX] = 0;
  setStatus(`Broke ${getBlockName(block)}`);
}

function placeBlock(tileX, tileY) {
  if (!inWorldBounds(tileX, tileY)) return;
  if (!isWithinReach(tileX, tileY)) {
    setStatus("Too far away");
    return;
  }
  if (world[tileY][tileX] !== BLOCK_AIR) return;
  if (isOverlappingPlayer(tileX, tileY)) return;

  const blockToPlace = PLACEABLE_BLOCKS[selectedBlockIndex];
  world[tileY][tileX] = blockToPlace;

  // start crop growth if farmland
  cropTimers[tileY][tileX] = (blockToPlace === BLOCK_FARMLAND) ? 1 : 0;
  setStatus(`Placed ${getBlockName(blockToPlace)}`);
}

// Mouse -> block coordinates use camera
function updateMouseTile(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  const worldX = mouseX + cameraX;
  const worldY = mouseY + cameraY;

  mouseTile = {
    x: Math.floor(worldX / TILE_SIZE),
    y: Math.floor(worldY / TILE_SIZE)
  };
}

canvas.addEventListener("mousemove", updateMouseTile);
canvas.addEventListener("mouseleave", () => {
  mouseTile = { x: -1, y: -1 };
});

canvas.addEventListener("mousedown", (e) => {
  updateMouseTile(e);
  const tileX = mouseTile.x;
  const tileY = mouseTile.y;

  if (e.button === 0) {
    placeBlock(tileX, tileY);
  } else if (e.button === 2) {
    breakBlock(tileX, tileY);
  }
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());
