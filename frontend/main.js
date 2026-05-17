import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createAnimals } from "/backend/game/entities/animals.js";
import { createMonsterSystem } from "/backend/game/entities/monsters.js";
import { createPlayer } from "/backend/game/player/player.js";
import { AXE_TOOL_TYPE } from "/backend/game/player/tools.js";
import { updateFollowCamera } from "/backend/game/player/camera.js";
import { createInput, updatePlayerMovement } from "/backend/game/player/movement.js";
import { createDayNightSystem } from "/backend/game/systems/daynight.js";
import { createInventory } from "/backend/game/systems/inventory.js";
import { createHud } from "./ui/hud.js";
import { createHotbar } from "./ui/hotbar.js";
import { createIntroOverlay } from "./ui/intro.js";
import { createAudioSystem } from "/backend/game/systems/audio.js";
import { createLighting } from "/backend/game/systems/lighting.js";
import { createSaveSystem } from "/backend/game/systems/save.js";
import { createBuildingSystem } from "/backend/game/world/building.js";
import { createBlockPatch, createTerrain } from "/backend/game/world/terrain.js";
import { interactWithVegetation } from "/backend/game/world/vegetation.js";

function createRenderingContext() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene,
    camera,
    renderer,
    clock: new THREE.Clock()
  };
}

const { scene, camera, renderer, clock } = createRenderingContext();
const lights = createLighting(scene);
const terrain = createTerrain(scene);
const inventory = createInventory();
const dayNight = createDayNightSystem();
const hud = createHud();
const hotbar = createHotbar();
const audio = createAudioSystem();
const input = createInput(renderer.domElement);
const GAME_STATE = {
  MENU: "MENU",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED"
};
let gameStarted = false;
let gamePaused = false;
let gameState = GAME_STATE.MENU;
let menuCameraAngle = 0;
let animationStarted = false;
const HEALTH_TRADE_COST = {
  wood: 3,
  meat: 1,
  stone: 1
};
const HEALTH_TRADE_AMOUNT = 25;

function isPlaying() {
  return gameStarted && !gamePaused && gameState === GAME_STATE.PLAYING;
}

function startGame() {
  console.log("[SurvivorCraft] startGame invoked", {
    gameStarted,
    gamePaused,
    gameState,
    controlsEnabled: input.enabled
  });

  gameStarted = true;
  gamePaused = false;
  gameState = GAME_STATE.PLAYING;
  input.clearKeys();
  input.setEnabled(true);
  audio.unlock();
  console.log("[SurvivorCraft] Gameplay state enabled", {
    gameStarted,
    gamePaused,
    gameState,
    controlsEnabled: input.enabled
  });

  if (!animationStarted) {
    startAnimationLoop();
  }
}

const intro = createIntroOverlay({
  onStart: startGame,
  onMusicVolumeChange: (volume) => audio.setVolume(volume)
});
const player = createPlayer(scene, terrain);
hotbar.onSelectionChange((item) => {
  player.equipTool(item.type === AXE_TOOL_TYPE ? AXE_TOOL_TYPE : null);
});
const animals = createAnimals(scene, terrain, 72);
const monsters = createMonsterSystem(scene, terrain);
const building = createBuildingSystem(scene, terrain);
const saveSystem = createSaveSystem({
  player,
  terrain,
  inventory,
  building,
  hud
});

createBlockPatch(scene, terrain);

const context = {
  scene,
  player,
  terrain,
  inventory,
  dayNight,
  hud,
  building
};

document.body.dataset.gameReady = "true";
console.log("[SurvivorCraft] Game systems initialized", {
  gameStarted,
  gamePaused,
  gameState,
  controlsEnabled: input.enabled
});

document.getElementById("load-game")?.addEventListener("click", () => {
  saveSystem.loadGame();
});

document.getElementById("trade-health")?.addEventListener("click", () => {
  if (!isPlaying()) return;

  const missing = Object.entries(HEALTH_TRADE_COST)
    .filter(([type, amount]) => (inventory.items[type] ?? 0) < amount)
    .map(([type, amount]) => `${amount} ${type}`);

  if (missing.length > 0) {
    hud.setStatus(`Need ${missing.join(", ")} for health trade`);
    return;
  }

  if (!player.health.heal(HEALTH_TRADE_AMOUNT)) {
    hud.setStatus("Health is already full");
    return;
  }

  for (const [type, amount] of Object.entries(HEALTH_TRADE_COST)) {
    inventory.removeItem(type, amount);
  }
  hud.setStatus(`Traded supplies for +${HEALTH_TRADE_AMOUNT} health`);
  hud.showFloatingText?.(`+${HEALTH_TRADE_AMOUNT} Health`);
});

input.setPrimaryAction(() => {
  if (!isPlaying()) return;

  const selectedItem = hotbar.getSelectedItem();
  if (selectedItem.type === AXE_TOOL_TYPE) player.swingTool(AXE_TOOL_TYPE);
  if (interactWithVegetation(terrain.getTreeResources(), player, camera, inventory, hud)) return;

  if (building.remove(camera, hud)) return;
  monsters.attackNearest(player, hud);
});

input.setDoubleAction(() => {
  if (!isPlaying()) return;

  if (animals.huntNearest(player, inventory, hud)) return;
  monsters.attackNearest(player, hud);
});

input.setSecondaryAction(() => {
  if (!isPlaying()) return;

  building.placeStoneWall(player, inventory, hud);
});

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.05);

  if (gameState === GAME_STATE.MENU) {
    menuCameraAngle += deltaTime * 0.16;
    const radius = 10;
    camera.position.set(Math.sin(menuCameraAngle) * radius, 5.4, 7 + Math.cos(menuCameraAngle) * radius);
    camera.lookAt(player.mesh.position.x, player.mesh.position.y + 1, player.mesh.position.z);
    renderer.render(scene, camera);
    return;
  }

  if (gameState === GAME_STATE.PAUSED) {
    renderer.render(scene, camera);
    return;
  }

  const movementState = updatePlayerMovement(player, input, terrain, deltaTime);

  terrain.update(player.mesh.position);
  dayNight.update(deltaTime, lights);
  if (dayNight.survivedNight) {
    hud.setStatus(`Night survived. Day ${dayNight.dayNumber}`, 4);
  }
  updateFollowCamera(camera, player, input, movementState);
  player.update(deltaTime);
  building.update(camera, player, hotbar);
  saveSystem.update(deltaTime);
  animals.update(deltaTime, context);
  monsters.update(deltaTime, context);
  audio.update(deltaTime, { dayNight, movementState });
  hud.update(deltaTime, context);
  hotbar.update();

  renderer.render(scene, camera);
}

function startAnimationLoop() {
  if (animationStarted) return;

  animationStarted = true;
  console.log("[SurvivorCraft] Animation loop started", {
    gameStarted,
    gamePaused,
    gameState
  });
  animate();
}

startAnimationLoop();
