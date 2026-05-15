import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createAnimals } from "/backend/game/entities/animals.js";
import { createMonsterSystem } from "/backend/game/entities/monsters.js";
import { createPlayer } from "/backend/game/player/player.js";
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
import { createFarmingSystem } from "/backend/game/world/farming.js";
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

function isPlaying() {
  return gameStarted && !gamePaused && gameState === GAME_STATE.PLAYING;
}

function startGame() {
  console.log("[FarmCraft] startGame invoked", {
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
  console.log("[FarmCraft] Gameplay state enabled", {
    gameStarted,
    gamePaused,
    gameState,
    controlsEnabled: input.enabled
  });

  if (!animationStarted) {
    startAnimationLoop();
  }

  const pointerLockRequest = input.requestPointerLock();
  console.log("[FarmCraft] Pointer lock requested", {
    controlsEnabled: input.enabled,
    requestCreated: Boolean(pointerLockRequest),
    pointerLocked: document.pointerLockElement === renderer.domElement
  });
  pointerLockRequest?.catch?.(() => {
    console.warn("[FarmCraft] Pointer lock request failed");
    hud.setStatus("Click the game view to lock mouse controls");
  });
}

const intro = createIntroOverlay({
  onStart: startGame,
  onMusicVolumeChange: (volume) => audio.setVolume(volume),
  onMouseSensitivityChange: (sensitivity) => input.setSensitivity(sensitivity)
});
const player = createPlayer(scene, terrain);
const animals = createAnimals(scene, terrain, 72);
const monsters = createMonsterSystem(scene, terrain);
const farming = createFarmingSystem(scene, terrain);
const building = createBuildingSystem(scene, terrain, farming);
const saveSystem = createSaveSystem({
  player,
  terrain,
  inventory,
  building,
  farming,
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
console.log("[FarmCraft] Game systems initialized", {
  gameStarted,
  gamePaused,
  gameState,
  controlsEnabled: input.enabled
});

document.getElementById("load-game")?.addEventListener("click", () => {
  saveSystem.loadGame();
});

input.setPrimaryAction(() => {
  if (!isPlaying()) return;

  if (building.remove(camera, hud)) return;
  if (interactWithVegetation(terrain.getTreeResources(), player, camera, inventory, hud)) return;
  if (farming.interact(camera, inventory, hud)) return;
  monsters.attackNearest(player, hud);
});

input.setSecondaryAction(() => {
  if (!isPlaying()) return;

  building.place(camera, player, hotbar, hud);
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
  building.update(camera, player, hotbar);
  farming.update(deltaTime);
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
  console.log("[FarmCraft] Animation loop started", {
    gameStarted,
    gamePaused,
    gameState
  });
  animate();
}

startAnimationLoop();
