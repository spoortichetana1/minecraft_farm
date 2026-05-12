import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { randomChoice, randomRange } from "../utils/math.js";
import { CHUNK_SIZE } from "./chunks.js";

function markShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function createPineTree(scene, terrain, x, z, parent, id) {
  const pine = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5a3824, roughness: 0.9 });
  const needleMaterial = new THREE.MeshStandardMaterial({ color: randomChoice([0x173d2a, 0x1f4f35, 0x244737]), roughness: 0.88 });
  const snowMaterial = new THREE.MeshStandardMaterial({ color: 0xf5fbff, roughness: 0.75 });
  const height = randomRange(2.2, 4.1);
  const harvestTargets = [];

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, height * 0.72, 8), trunkMaterial);
  trunk.position.y = height * 0.36;
  markShadow(trunk);
  pine.add(trunk);
  harvestTargets.push(trunk);

  for (let i = 0; i < 4; i++) {
    const radius = 0.95 - i * 0.17;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, 1.15, 9), needleMaterial);
    cone.position.y = height * 0.42 + i * 0.55;
    markShadow(cone);
    pine.add(cone);
    harvestTargets.push(cone);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.82, 0.22, 9), snowMaterial);
    cap.position.y = cone.position.y + 0.27;
    markShadow(cap);
    pine.add(cap);
  }

  pine.position.set(x, terrain.getHeight(x, z), z);
  parent.add(pine);

  const resource = {
    type: "pine",
    resource: "wood",
    id,
    woodYield: height > 3.2 ? 3 : 2,
    mesh: pine,
    harvestTargets,
    alive: true
  };

  for (const target of harvestTargets) {
    target.userData.treeResource = resource;
  }

  return resource;
}

function createSnowRock(terrain, x, z, parent) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(randomRange(0.35, 0.85), 0),
    new THREE.MeshStandardMaterial({ color: randomChoice([0x9ab0bd, 0x7f96a3, 0xb8cdd8]), roughness: 0.95 })
  );

  rock.scale.set(randomRange(1, 1.8), randomRange(0.45, 0.9), randomRange(0.8, 1.45));
  rock.rotation.set(randomRange(0, 0.35), randomRange(0, Math.PI), randomRange(0, 0.35));
  rock.position.set(x, terrain.getHeight(x, z) + 0.14, z);
  markShadow(rock);
  parent.add(rock);

  const snowCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.36, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xf5fbff, roughness: 0.8 })
  );
  snowCap.scale.set(1.35, 0.25, 1);
  snowCap.position.set(x, rock.position.y + 0.28, z);
  parent.add(snowCap);
}

function createFrozenLake(terrain, x, z, parent) {
  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(randomRange(1.6, 3.4), 24),
    new THREE.MeshStandardMaterial({
      color: randomChoice([0xa7d8ef, 0x8bc4de, 0xc4ecff]),
      roughness: 0.25,
      transparent: true,
      opacity: 0.78
    })
  );

  lake.rotation.x = -Math.PI / 2;
  lake.position.set(x, terrain.getHeight(x, z) + 0.025, z);
  lake.receiveShadow = true;
  parent.add(lake);
}

function createSnowDrift(terrain, x, z, parent) {
  const drift = new THREE.Mesh(
    new THREE.SphereGeometry(randomRange(0.35, 0.75), 10, 6),
    new THREE.MeshStandardMaterial({ color: 0xf5fbff, roughness: 0.85 })
  );

  drift.scale.set(randomRange(1.4, 2.6), randomRange(0.18, 0.34), randomRange(0.9, 1.7));
  drift.position.set(x, terrain.getHeight(x, z) + 0.08, z);
  drift.rotation.y = randomRange(0, Math.PI);
  parent.add(drift);
}

export function spawnTrees(scene, terrain, count) {
  const resources = [];

  for (let i = 0; i < count; i++) {
    resources.push(createPineTree(scene, terrain, randomRange(-21, 21), randomRange(-21, 21), scene, `pine:legacy:${i}`));
  }

  return resources;
}

export function scatterWildflowers() {
  // Snow biome keeps the ground quiet and frozen.
}

export function createChunkVegetation(scene, terrain, chunkX, chunkZ, random, removedResourceIds) {
  const group = new THREE.Group();
  const resources = [];
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;

  scene.add(group);

  for (let i = 0; i < 7; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;
    const id = `pine:${chunkX},${chunkZ}:${i}`;

    if (removedResourceIds.has(id)) continue;
    if (Math.abs(x) < 4 && Math.abs(z - 7) < 4) continue;
    if (random() < 0.68) {
      resources.push(createPineTree(scene, terrain, x, z, group, id));
    }
  }

  for (let i = 0; i < 7; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;
    if (random() < 0.62) createSnowRock(terrain, x, z, group);
  }

  for (let i = 0; i < 2; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;
    if (random() < 0.34) createFrozenLake(terrain, x, z, group);
  }

  for (let i = 0; i < 8; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;
    if (random() < 0.58) createSnowDrift(terrain, x, z, group);
  }

  return {
    group,
    resources
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
    hud.setStatus("Aim at a pine tree");
    return false;
  }

  const tree = hit.object.userData.treeResource;
  if (!tree?.alive) return false;

  tree.alive = false;
  tree.mesh.parent.remove(tree.mesh);
  if (tree.id) resources.removedResourceIds?.add(tree.id);
  inventory.addItem(tree.resource, tree.woodYield ?? 2);
  hud.setStatus(`+${tree.woodYield ?? 2} wood`);
  return true;
}
