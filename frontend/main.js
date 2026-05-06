import { createLighting, createRenderingContext } from "./rendering/scene.js";
import { createAnimals } from "./entities/animals.js";
import { createMonsterSystem } from "./entities/monsters.js";
import { createPlayer } from "./player/player.js";
import { createInput } from "./systems/input.js";
import { createInventory } from "./systems/inventory.js";
import { createTimeSystem } from "./systems/time.js";
import { createHud } from "./ui/hud.js";
import { createBlockPatch, createTerrain } from "./world/terrain.js";
import { interactWithResources, spawnTrees } from "./world/resources.js";

const { scene, camera, renderer, clock } = createRenderingContext();
const lights = createLighting(scene);
const terrain = createTerrain(scene);
const inventory = createInventory();
const time = createTimeSystem();
const hud = createHud();
const input = createInput(renderer.domElement);
const player = createPlayer(scene, terrain);
const animals = createAnimals(scene, terrain, 12);
const monsters = createMonsterSystem(scene, terrain);
const resources = spawnTrees(scene, terrain, 24);

createBlockPatch(scene, terrain);

const context = {
  scene,
  player,
  terrain,
  inventory,
  time,
  hud
};

input.setPrimaryAction(() => {
  if (interactWithResources(resources, player, inventory, hud)) return;
  monsters.attackNearest(player, hud);
});

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = Math.min(clock.getDelta(), 0.05);

  time.update(deltaTime, { lights });
  player.update(deltaTime, { camera, input, terrain });
  animals.update(deltaTime, context);
  monsters.update(deltaTime, context);
  hud.update(deltaTime, context);

  renderer.render(scene, camera);
}

animate();
