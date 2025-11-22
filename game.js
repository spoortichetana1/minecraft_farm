const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// World grid (50x50)
const WORLD_WIDTH = 50;
const WORLD_HEIGHT = 50;
const TILE_SIZE = 16; // smaller tiles so full world fits better

// Match canvas size to world size
canvas.width = WORLD_WIDTH * TILE_SIZE;   // 50 * 16 = 800
canvas.height = WORLD_HEIGHT * TILE_SIZE; // 50 * 16 = 800

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Block types
const BLOCK_AIR = 0;
const BLOCK_GRASS = 1;
const BLOCK_DIRT = 2;
const BLOCK_WOOD = 3;
const BLOCK_LEAVES = 4;

// World generation function
function generateWorld() {
    let world = [];
    let heightMap = [];

    // Terrain parameters
    let baseHeight = 30;        // lowered so ground is visible
    let hillAmplitude = 4;      // slightly smaller hills
    let hillFrequency = 0.15;

    // Generate height map for hills
    for (let x = 0; x < WORLD_WIDTH; x++) {
        let height = baseHeight + Math.round(
            Math.sin(x * hillFrequency) * hillAmplitude + Math.random() * 2 - 1
        );
        heightMap.push(height);
    }

    // Build world: air above, grass at surface, dirt below
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        let row = [];
        for (let x = 0; x < WORLD_WIDTH; x++) {
            if (y > heightMap[x])       row.push(BLOCK_DIRT);
            else if (y === heightMap[x]) row.push(BLOCK_GRASS);
            else                        row.push(BLOCK_AIR);
        }
        world.push(row);
    }

    // Add trees
    for (let x = 2; x < WORLD_WIDTH - 2; x++) {
        if (Math.random() < 0.08) { // 8% chance per column
            let groundY = heightMap[x];

            // Trunk (3 blocks tall)
            for (let t = 1; t <= 3; t++) {
                if (groundY - t >= 0) world[groundY - t][x] = BLOCK_WOOD;
            }

            // Leaves (simple 3x3 blob above trunk)
            for (let dy = -4; dy <= -2; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    let lx = x + dx;
                    let ly = groundY + dy;
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

// Player properties
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

// Keys
let keys = {};
document.addEventListener("keydown", (e) => { keys[e.code] = true; });
document.addEventListener("keyup",   (e) => { keys[e.code] = false; });

// Solid block check (what you collide with)
function isSolidBlock(x, y) {
    if (x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) return false;
    const block = world[y][x];
    return (
        block === BLOCK_GRASS ||
        block === BLOCK_DIRT ||
        block === BLOCK_WOOD ||
        block === BLOCK_LEAVES
    );
}

// Update physics + movement
function update() {
    // Horizontal input
    if (keys["ArrowLeft"])      player.vx = -player.speed;
    else if (keys["ArrowRight"]) player.vx =  player.speed;
    else                         player.vx = 0;

    // Jump
    if (keys["ArrowUp"] && !player.jumping) {
        player.vy = -10;
        player.jumping = true;
    }

    // Gravity
    player.vy += GRAVITY;

    // Horizontal movement with collision
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
    if (!blockedX) player.x = newX;

    // Vertical movement with collision
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
        // If falling, snap to top of block
        if (player.vy > 0) {
            player.y = bottom * TILE_SIZE - player.height;
            player.jumping = false;
        }
        // If jumping, snap to bottom of block
        else if (player.vy < 0) {
            player.y = (top + 1) * TILE_SIZE;
        }
        player.vy = 0;
    }
}

// Draw everything
function draw() {
    // Sky
    ctx.fillStyle = "#87ceeb";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // World blocks
    for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let x = 0; x < WORLD_WIDTH; x++) {
            const block = world[y][x];
            if (block === BLOCK_AIR) continue;

            if (block === BLOCK_GRASS)      ctx.fillStyle = "#228B22";
            else if (block === BLOCK_DIRT)  ctx.fillStyle = "#8B4513";
            else if (block === BLOCK_WOOD)  ctx.fillStyle = "#A0522D";
            else if (block === BLOCK_LEAVES)ctx.fillStyle = "#4CAF50";

            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Player
    ctx.fillStyle = "yellow";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();

// --- Block breaking / placing ---

// Break a block if the tile is not air and not inside the player
function breakBlock(tileX, tileY) {
    if (tileX < 0 || tileY < 0 || tileX >= WORLD_WIDTH || tileY >= WORLD_HEIGHT) return;
    if (world[tileY][tileX] === BLOCK_AIR) return;

    // Check if block is inside player
    const px1 = player.x,               px2 = player.x + player.width;
    const py1 = player.y,               py2 = player.y + player.height;
    const bx1 = tileX * TILE_SIZE,      bx2 = bx1 + TILE_SIZE;
    const by1 = tileY * TILE_SIZE,      by2 = by1 + TILE_SIZE;

    // If overlapping with player, do nothing
    if (!(px2 <= bx1 || px1 >= bx2 || py2 <= by1 || py1 >= by2)) return;

    world[tileY][tileX] = BLOCK_AIR;
}

// Place a grass block if tile is air and not inside player
function placeBlock(tileX, tileY) {
    if (tileX < 0 || tileY < 0 || tileX >= WORLD_WIDTH || tileY >= WORLD_HEIGHT) return;
    if (world[tileY][tileX] !== BLOCK_AIR) return;

    const px1 = player.x,               px2 = player.x + player.width;
    const py1 = player.y,               py2 = player.y + player.height;
    const bx1 = tileX * TILE_SIZE,      bx2 = bx1 + TILE_SIZE;
    const by1 = tileY * TILE_SIZE,      by2 = by1 + TILE_SIZE;

    // If overlapping with player, do nothing
    if (!(px2 <= bx1 || px1 >= bx2 || py2 <= by1 || py1 >= by2)) return;

    world[tileY][tileX] = BLOCK_GRASS;
}

// Mouse events for placing and breaking blocks
canvas.addEventListener("mousedown", function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const tileX = Math.floor(mouseX / TILE_SIZE);
    const tileY = Math.floor(mouseY / TILE_SIZE);

    if (e.button === 0) {
        // Left click: place block
        placeBlock(tileX, tileY);
    } else if (e.button === 2) {
        // Right click: break block
        breakBlock(tileX, tileY);
    }
});

// Prevent context menu on right-click
canvas.addEventListener("contextmenu", function(e) {
    e.preventDefault();
});
