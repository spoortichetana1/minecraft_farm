import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createAnimals } from "/game/entities/animals.js";
import { createMonsterSystem } from "/game/entities/monsters.js";
import { createPlayer } from "/game/player/player.js";
import { updateFollowCamera } from "/game/player/camera.js";
import { createInput, updatePlayerMovement } from "/game/player/movement.js";
import { createDayNightSystem } from "/game/systems/daynight.js";
import { createInventory } from "/game/systems/inventory.js";
import { createHud } from "./ui/hud.js";
import { createHotbar } from "./ui/hotbar.js";
import { createIntroOverlay } from "./ui/intro.js";
import { createAudioSystem } from "/game/systems/audio.js";
import { createLighting } from "/game/systems/lighting.js";
import { createSaveSystem } from "/game/systems/save.js";
import { createBuildingSystem } from "/game/world/building.js";
import { createFarmingSystem } from "/game/world/farming.js";
import { createBlockPatch, createTerrain } from "/game/world/terrain.js";
import { interactWithVegetation } from "/game/world/vegetation.js";

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
const intro = createIntroOverlay({
  onStart: () => audio.unlock()
});
const input = createInput(renderer.domElement);
const player = createPlayer(scene, terrain);
const animals = createAnimals(scene, terrain, 56);
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

document.getElementById("load-game")?.addEventListener("click", () => {
  saveSystem.loadGame();
});

input.setPrimaryAction(() => {
  if (!intro.isStarted()) return;

  if (building.remove(camera, hud)) return;
  if (interactWithVegetation(terrain.getTreeResources(), player, camera, inventory, hud)) return;
  if (farming.interact(camera, inventory, hud)) return;
  monsters.attackNearest(player, hud);
});

input.setSecondaryAction(() => {
  if (!intro.isStarted()) return;

  building.place(camera, player, hotbar, hud);
});

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.05);

  if (!intro.isStarted()) {
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

animate();
