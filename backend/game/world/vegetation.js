import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { randomChoice, randomRange } from "../utils/math.js";
import { CHUNK_SIZE } from "./chunks.js";

function markShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.82,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  });
}

function addHarvestTarget(resource, mesh) {
  resource.harvestTargets.push(mesh);
  mesh.userData.treeResource = resource;
}

function createTreeResource(type, resource, id, woodYield, mesh, harvestTargets) {
  const tree = { type, resource, id, woodYield, mesh, harvestTargets, alive: true };
  for (const target of harvestTargets) target.userData.treeResource = tree;
  return tree;
}

function createOakTree(scene, terrain, x, z, parent, id) {
  const tree = new THREE.Group();
  const harvestTargets = [];
  const height = randomRange(2.5, 4.2);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, height, 8), material(0x6b4326));
  trunk.position.y = height / 2;
  markShadow(trunk);
  tree.add(trunk);
  harvestTargets.push(trunk);

  const leaves = new THREE.Mesh(new THREE.SphereGeometry(randomRange(0.95, 1.35), 12, 9), material(randomChoice([0x1f6d31, 0x2f8a3b, 0x3a9b46])));
  leaves.position.y = height + 0.62;
  leaves.scale.set(1.25, 0.88, 1.15);
  markShadow(leaves);
  tree.add(leaves);

  tree.position.set(x, terrain.getHeight(x, z), z);
  parent.add(tree);
  return createTreeResource("oak", "wood", id, height > 3.3 ? 3 : 2, tree, harvestTargets);
}

function createPineTree(scene, terrain, x, z, parent, id) {
  const pine = new THREE.Group();
  const harvestTargets = [];
  const height = randomRange(2.2, 4.1);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, height * 0.72, 8), material(0x5a3824));
  trunk.position.y = height * 0.36;
  markShadow(trunk);
  pine.add(trunk);
  harvestTargets.push(trunk);

  for (let i = 0; i < 4; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.95 - i * 0.17, 1.15, 9), material(randomChoice([0x173d2a, 0x1f4f35, 0x244737])));
    cone.position.y = height * 0.42 + i * 0.55;
    markShadow(cone);
    pine.add(cone);
  }

  pine.position.set(x, terrain.getHeight(x, z), z);
  parent.add(pine);
  return createTreeResource("pine", "wood", id, height > 3.2 ? 3 : 2, pine, harvestTargets);
}

function createTwistedTree(scene, terrain, x, z, parent, id) {
  const tree = new THREE.Group();
  const harvestTargets = [];
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.27, 2.4, 7), material(0x3b2618));
  trunk.position.y = 1.2;
  trunk.rotation.z = randomRange(-0.28, 0.28);
  markShadow(trunk);
  tree.add(trunk);
  harvestTargets.push(trunk);

  for (let i = 0; i < 3; i++) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.2, 6), material(0x2b1d14));
    branch.position.set(randomRange(-0.35, 0.35), randomRange(1.65, 2.45), randomRange(-0.25, 0.25));
    branch.rotation.set(randomRange(0.5, 1.1), randomRange(0, Math.PI), randomRange(-0.55, 0.55));
    markShadow(branch);
    tree.add(branch);
  }

  tree.position.set(x, terrain.getHeight(x, z), z);
  parent.add(tree);
  return createTreeResource("twisted-tree", "wood", id, 2, tree, harvestTargets);
}

function createCharredTrunk(scene, terrain, x, z, parent, id) {
  const trunkGroup = new THREE.Group();
  const harvestTargets = [];
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, randomRange(1.4, 2.4), 7),
    material(0x1b130f, { emissive: 0x2a0800, emissiveIntensity: 0.25 })
  );
  trunk.position.y = 0.9;
  trunk.rotation.z = randomRange(-0.24, 0.24);
  markShadow(trunk);
  trunkGroup.add(trunk);
  harvestTargets.push(trunk);

  for (let i = 0; i < 3; i++) {
    const crack = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.45, 0.018), material(0xff4a00, { emissive: 0xff2600, emissiveIntensity: 1.2 }));
    crack.position.set(randomRange(-0.12, 0.12), randomRange(0.55, 1.45), randomRange(-0.19, 0.19));
    trunkGroup.add(crack);
  }

  trunkGroup.position.set(x, terrain.getHeight(x, z), z);
  parent.add(trunkGroup);
  return createTreeResource("charred-trunk", "wood", id, 1, trunkGroup, harvestTargets);
}

function createFlower(terrain, x, z, parent, color) {
  const flower = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 5), material(0x2f7d31));
  stem.position.y = 0.16;
  flower.add(stem);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), material(color));
  top.position.y = 0.34;
  flower.add(top);
  flower.position.set(x, terrain.getHeight(x, z), z);
  parent.add(flower);
}

function createGrassPatch(terrain, x, z, parent) {
  const patch = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, randomRange(0.25, 0.55), 4), material(randomChoice([0x2f8a2f, 0x4aab36, 0x6cbf3e])));
    blade.position.set(randomRange(-0.22, 0.22), blade.geometry.parameters.height / 2, randomRange(-0.22, 0.22));
    blade.rotation.z = randomRange(-0.25, 0.25);
    patch.add(blade);
  }
  patch.position.set(x, terrain.getHeight(x, z), z);
  parent.add(patch);
}

function createRock(terrain, x, z, parent, palette) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(randomRange(0.32, 0.82), 0),
    material(randomChoice(palette), { roughness: 0.95 })
  );
  rock.scale.set(randomRange(1, 1.8), randomRange(0.45, 0.9), randomRange(0.8, 1.45));
  rock.rotation.set(randomRange(0, 0.35), randomRange(0, Math.PI), randomRange(0, 0.35));
  rock.position.set(x, terrain.getHeight(x, z) + 0.14, z);
  markShadow(rock);
  parent.add(rock);
}

function createWaterPatch(terrain, x, z, parent, color, opacity = 0.72) {
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(randomRange(1.6, 3.6), 24),
    material(color, { roughness: 0.22, transparent: true, opacity })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(x, terrain.getHeight(x, z) + 0.025, z);
  water.receiveShadow = true;
  parent.add(water);
}

function createLavaPool(terrain, x, z, parent) {
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(randomRange(1.25, 3.2), 28),
    material(0xff5a00, { emissive: 0xff2b00, emissiveIntensity: 1.8, roughness: 0.35 })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x, terrain.getHeight(x, z) + 0.035, z);
  parent.add(pool);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(pool.geometry.parameters.radius * 0.94, 0.07, 8, 28), material(0x1b1b1b));
  rim.rotation.x = Math.PI / 2;
  rim.position.copy(pool.position);
  rim.position.y += 0.02;
  parent.add(rim);
}

function createLavaRiver(terrain, x, z, parent) {
  const river = new THREE.Group();
  const length = randomRange(4, 7);
  for (let i = 0; i < length; i++) {
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.05, 1),
      material(0xff6200, { emissive: 0xff2b00, emissiveIntensity: 1.65, roughness: 0.38 })
    );
    seg.position.set(i * 0.86, 0.03, Math.sin(i * 0.8) * 0.45);
    seg.rotation.y = randomRange(-0.25, 0.25);
    river.add(seg);
  }
  river.position.set(x, terrain.getHeight(x, z) + 0.03, z);
  river.rotation.y = randomRange(0, Math.PI);
  parent.add(river);
}

function createSmokeVent(terrain, x, z, parent) {
  const vent = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.DodecahedronGeometry(randomRange(0.32, 0.72), 0),
    material(randomChoice([0x151515, 0x242424, 0x373737]), { roughness: 0.95 })
  );
  base.scale.set(1.4, 0.55, 1.2);
  base.position.y = 0.16;
  markShadow(base);
  vent.add(base);

  for (let i = 0; i < 4; i++) {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.22 + i * 0.08, 8, 6),
      material(0x6a5f58, { transparent: true, opacity: 0.28, roughness: 1 })
    );
    smoke.position.set(randomRange(-0.1, 0.1), 0.55 + i * 0.42, randomRange(-0.1, 0.1));
    vent.add(smoke);
  }
  vent.position.set(x, terrain.getHeight(x, z), z);
  parent.add(vent);
}

function createCactus(terrain, x, z, parent) {
  const cactus = new THREE.Group();
  const green = material(0x3c8f40);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, randomRange(1.1, 2.2), 7), green);
  trunk.position.y = trunk.geometry.parameters.height / 2;
  markShadow(trunk);
  cactus.add(trunk);
  cactus.position.set(x, terrain.getHeight(x, z), z);
  parent.add(cactus);
}

function createBush(terrain, x, z, parent, color) {
  const bush = new THREE.Mesh(new THREE.SphereGeometry(randomRange(0.32, 0.7), 9, 6), material(color));
  bush.scale.set(randomRange(1.2, 1.8), randomRange(0.45, 0.75), randomRange(1, 1.55));
  bush.position.set(x, terrain.getHeight(x, z) + 0.22, z);
  markShadow(bush);
  parent.add(bush);
}

function createFallenLog(terrain, x, z, parent) {
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, randomRange(1.4, 2.4), 8), material(0x6b4326));
  log.rotation.z = Math.PI / 2;
  log.rotation.y = randomRange(0, Math.PI);
  log.position.set(x, terrain.getHeight(x, z) + 0.22, z);
  markShadow(log);
  parent.add(log);
}

function addForest(scene, terrain, group, resources, chunkX, chunkZ, random) {
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  for (let i = 0; i < 9; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;
    resources.push(createOakTree(scene, terrain, x, z, group, `oak:${chunkX},${chunkZ}:${i}`));
  }
  for (let i = 0; i < 12; i++) createBush(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, randomChoice([0x235f2d, 0x2f7d35, 0x3d8f3c]));
  for (let i = 0; i < 14; i++) createFlower(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, randomChoice([0xe84f4f, 0xf5dd4d, 0xffffff, 0x8d61d8]));
  for (let i = 0; i < 3; i++) createFallenLog(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group);
}

function addPlains(terrain, group, chunkX, chunkZ, random) {
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  for (let i = 0; i < 22; i++) createGrassPatch(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group);
  for (let i = 0; i < 18; i++) createFlower(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, randomChoice([0xf44336, 0xffd54f, 0xffffff, 0x7e57c2]));
  for (let i = 0; i < 3; i++) createRock(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, [0x777777, 0x8b8b82, 0x5f6358]);
}

function addDesert(terrain, group, chunkX, chunkZ, random) {
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  for (let i = 0; i < 4; i++) createCactus(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group);
  for (let i = 0; i < 7; i++) createBush(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, randomChoice([0x8a6b35, 0x6d5a30, 0x9a7c45]));
  for (let i = 0; i < 5; i++) createRock(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, [0x9b7242, 0xb5844b, 0x6f5135]);
}

function addSnow(scene, terrain, group, resources, chunkX, chunkZ, random) {
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  for (let i = 0; i < 7; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;
    resources.push(createPineTree(scene, terrain, x, z, group, `pine:${chunkX},${chunkZ}:${i}`));
  }
  for (let i = 0; i < 7; i++) createRock(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, [0x9ab0bd, 0x7f96a3, 0xb8cdd8]);
  for (let i = 0; i < 2; i++) createWaterPatch(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, 0xa7d8ef, 0.78);
}

function addSwamp(scene, terrain, group, resources, chunkX, chunkZ, random) {
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  for (let i = 0; i < 6; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;
    resources.push(createTwistedTree(scene, terrain, x, z, group, `twisted:${chunkX},${chunkZ}:${i}`));
  }
  for (let i = 0; i < 6; i++) createWaterPatch(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, 0x2f4f32, 0.62);
  for (let i = 0; i < 9; i++) createBush(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, randomChoice([0x314d22, 0x55612a, 0x734f38]));
}

function addVolcanic(scene, terrain, group, resources, chunkX, chunkZ, random) {
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  for (let i = 0; i < 3; i++) createLavaPool(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group);
  for (let i = 0; i < 2; i++) createLavaRiver(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group);
  for (let i = 0; i < 5; i++) createSmokeVent(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group);
  for (let i = 0; i < 8; i++) createRock(terrain, minX + random() * CHUNK_SIZE, minZ + random() * CHUNK_SIZE, group, [0x151515, 0x242424, 0x373737]);
  for (let i = 0; i < 3; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;
    resources.push(createCharredTrunk(scene, terrain, x, z, group, `charred:${chunkX},${chunkZ}:${i}`));
  }
}

export function spawnTrees(scene, terrain, count) {
  const resources = [];
  for (let i = 0; i < count; i++) {
    resources.push(createOakTree(scene, terrain, randomRange(-21, 21), randomRange(-21, 21), scene, `oak:legacy:${i}`));
  }
  return resources;
}

export function scatterWildflowers(scene, terrain, count = 120) {
  const group = new THREE.Group();
  scene.add(group);
  for (let i = 0; i < count; i++) {
    createFlower(terrain, randomRange(-55, 55), randomRange(-55, 55), group, randomChoice([0xe84f4f, 0xf5dd4d, 0xffffff, 0x8d61d8]));
  }
}

export function createChunkVegetation(scene, terrain, chunkX, chunkZ, random, removedResourceIds) {
  const group = new THREE.Group();
  const resources = [];
  const centerX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
  const centerZ = chunkZ * CHUNK_SIZE + CHUNK_SIZE / 2;
  const biome = terrain.getBiomeAt(centerX, centerZ);

  scene.add(group);

  if (biome === "forest") addForest(scene, terrain, group, resources, chunkX, chunkZ, random);
  if (biome === "plains") addPlains(terrain, group, chunkX, chunkZ, random);
  if (biome === "desert") addDesert(terrain, group, chunkX, chunkZ, random);
  if (biome === "snow") addSnow(scene, terrain, group, resources, chunkX, chunkZ, random);
  if (biome === "swamp") addSwamp(scene, terrain, group, resources, chunkX, chunkZ, random);
  if (biome === "volcanic") addVolcanic(scene, terrain, group, resources, chunkX, chunkZ, random);

  const keptResources = resources.filter((resource) => {
    if (!removedResourceIds.has(resource.id)) return true;
    resource.mesh.parent?.remove(resource.mesh);
    return false;
  });

  return {
    group,
    biome,
    resources: keptResources
  };
}

export function interactWithVegetation(resources, player, camera, inventory, hud) {
  const raycaster = new THREE.Raycaster();
  const screenCenter = new THREE.Vector2(0, 0);
  const targets = resources
    .filter((resource) => resource.alive)
    .flatMap((resource) => resource.harvestTargets ?? []);

  raycaster.setFromCamera(screenCenter, camera);
  const hits = raycaster.intersectObjects(targets, false);
  const hit = hits.find((result) => result.distance <= 4);

  if (!hit) {
    hud.setStatus("Aim at a harvestable tree");
    return false;
  }

  const tree = hit.object.userData.treeResource;
  if (!tree?.alive) return false;

  tree.alive = false;
  tree.mesh.parent.remove(tree.mesh);
  if (tree.id) resources.removedResourceIds?.add(tree.id);
  inventory.addItem(tree.resource, tree.woodYield ?? 1);
  hud.setStatus(`+${tree.woodYield ?? 1} wood`);
  return true;
}
