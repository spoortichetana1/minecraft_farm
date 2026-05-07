import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { randomChoice, randomRange } from "../utils/math.js";
import { CHUNK_SIZE } from "./chunks.js";

function markShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function createTree(scene, terrain, x, z, parent = scene, id = null) {
  const tree = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x1f7a32, roughness: 0.85 });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.6, 8), trunkMaterial);
  trunk.position.y = 0.8;
  markShadow(trunk);
  tree.add(trunk);

  const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), leafMaterial);
  leaves.position.y = 1.85;
  leaves.scale.set(1, 0.85, 1);
  markShadow(leaves);
  tree.add(leaves);

  tree.position.set(x, terrain.getHeight(x, z), z);
  parent.add(tree);

  const resource = {
    type: "tree",
    resource: "wood",
    id,
    mesh: tree,
    trunk,
    alive: true
  };

  trunk.userData.treeResource = resource;
  return resource;
}

function createFlower(scene, terrain, x, z, color, parent = scene) {
  const flower = new THREE.Group();
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.9 });
  const topMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 6), stemMaterial);
  stem.position.y = 0.175;
  flower.add(stem);

  const top = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), topMaterial);
  top.position.y = 0.4;
  flower.add(top);

  flower.position.set(x, terrain.getHeight(x, z), z);
  parent.add(flower);
}

export function spawnTrees(scene, terrain, count) {
  const resources = [];

  for (let i = 0; i < count; i++) {
    const x = randomRange(-21, 21);
    const z = randomRange(-21, 21);

    if (Math.abs(x) < 4 && Math.abs(z - 7) < 4) continue;
    resources.push(createTree(scene, terrain, x, z));
  }

  return resources;
}

export function scatterWildflowers(scene, terrain, count) {
  const colors = [0xff3b30, 0xffd60a, 0xffffff, 0x9b5de5];

  for (let i = 0; i < count; i++) {
    createFlower(scene, terrain, randomRange(-24, 24), randomRange(-24, 24), randomChoice(colors));
  }
}

export function createChunkVegetation(scene, terrain, chunkX, chunkZ, random, removedResourceIds) {
  const group = new THREE.Group();
  const resources = [];
  const minX = chunkX * CHUNK_SIZE;
  const minZ = chunkZ * CHUNK_SIZE;
  const flowerColors = [0xff3b30, 0xffd60a, 0xffffff, 0x9b5de5];

  scene.add(group);

  for (let i = 0; i < 5; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;
    const id = `tree:${chunkX},${chunkZ}:${i}`;

    if (removedResourceIds.has(id)) continue;
    if (Math.abs(x) < 4 && Math.abs(z - 7) < 4) continue;
    if (random() < 0.42) {
      resources.push(createTree(scene, terrain, x, z, group, id));
    }
  }

  for (let i = 0; i < 22; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;

    if (Math.abs(x) < 3 && Math.abs(z) < 3) continue;
    if (random() < 0.75) {
      createFlower(scene, terrain, x, z, randomChoice(flowerColors), group);
    }
  }

  return {
    group,
    resources
  };
}

export function interactWithVegetation(resources, player, camera, inventory, hud) {
  const raycaster = new THREE.Raycaster();
  const screenCenter = new THREE.Vector2(0, 0);
  const trunks = resources
    .filter((resource) => resource.alive)
    .map((resource) => resource.trunk);

  raycaster.setFromCamera(screenCenter, camera);
  const hits = raycaster.intersectObjects(trunks, false);
  const hit = hits.find((result) => result.distance <= 4);

  if (!hit) {
    hud.setStatus("Aim at a tree trunk");
    return false;
  }

  const tree = hit.object.userData.treeResource;
  if (!tree?.alive) return false;

  tree.alive = false;
  tree.mesh.parent.remove(tree.mesh);
  if (tree.id) resources.removedResourceIds?.add(tree.id);
  inventory.addItem(tree.resource, 1);
  hud.setStatus("+1 wood");
  return true;
}
