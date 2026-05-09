import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { randomChoice, randomRange } from "../utils/math.js";
import { CHUNK_SIZE } from "./chunks.js";

const TREE_VARIANTS = [
  {
    name: "small",
    trunkHeight: 1.25,
    trunkTopRadius: 0.15,
    trunkBottomRadius: 0.2,
    leafRadius: 0.62,
    leafY: 1.45,
    woodYield: 1
  },
  {
    name: "medium",
    trunkHeight: 1.7,
    trunkTopRadius: 0.18,
    trunkBottomRadius: 0.25,
    leafRadius: 0.82,
    leafY: 1.95,
    woodYield: 2
  },
  {
    name: "large",
    trunkHeight: 2.25,
    trunkTopRadius: 0.24,
    trunkBottomRadius: 0.32,
    leafRadius: 1.05,
    leafY: 2.55,
    woodYield: 3
  }
];

function markShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function pickTreeVariant(random = Math.random) {
  const roll = random();

  if (roll < 0.45) return TREE_VARIANTS[0];
  if (roll < 0.85) return TREE_VARIANTS[1];
  return TREE_VARIANTS[2];
}

function createLeafPuff(radius, color) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 10, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
  );

  mesh.scale.y = 0.85;
  markShadow(mesh);
  return mesh;
}

function createTree(scene, terrain, x, z, parent = scene, id = null, variant = pickTreeVariant()) {
  const tree = new THREE.Group();
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
  const leafColors = [0x1f7a32, 0x2f8f3f, 0x276b30];
  const harvestTargets = [];

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(
      variant.trunkTopRadius,
      variant.trunkBottomRadius,
      variant.trunkHeight,
      8
    ),
    trunkMaterial
  );
  trunk.position.y = variant.trunkHeight / 2;
  markShadow(trunk);
  tree.add(trunk);
  harvestTargets.push(trunk);

  const canopyOffsets = [
    [0, 0, 0, 1],
    [0.42, -0.05, 0, 0.78],
    [-0.42, -0.04, 0.08, 0.76],
    [0.05, -0.02, 0.42, 0.72],
    [-0.04, -0.02, -0.42, 0.72],
    [0, 0.42, 0, 0.58]
  ];

  for (const [offsetX, offsetY, offsetZ, scale] of canopyOffsets) {
    const leaves = createLeafPuff(variant.leafRadius * scale, randomChoice(leafColors));
    leaves.position.set(offsetX * variant.leafRadius, variant.leafY + offsetY * variant.leafRadius, offsetZ * variant.leafRadius);
    tree.add(leaves);
    harvestTargets.push(leaves);
  }

  tree.position.set(x, terrain.getHeight(x, z), z);
  parent.add(tree);

  const resource = {
    type: "tree",
    resource: "wood",
    id,
    size: variant.name,
    woodYield: variant.woodYield,
    mesh: tree,
    trunk,
    harvestTargets,
    alive: true
  };

  for (const target of harvestTargets) {
    target.userData.treeResource = resource;
  }

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

  for (let i = 0; i < 7; i++) {
    const x = minX + random() * CHUNK_SIZE;
    const z = minZ + random() * CHUNK_SIZE;
    const id = `tree:${chunkX},${chunkZ}:${i}`;
    const height = terrain.getHeight(x, z);

    if (removedResourceIds.has(id)) continue;
    if (Math.abs(x) < 4 && Math.abs(z - 7) < 4) continue;
    if (height < -1.25) continue;
    if (random() < 0.48) {
      resources.push(createTree(scene, terrain, x, z, group, id, pickTreeVariant(random)));
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
    .flatMap((resource) => resource.harvestTargets ?? [resource.trunk]);

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
  inventory.addItem(tree.resource, tree.woodYield ?? 1);
  hud.setStatus(`+${tree.woodYield ?? 1} wood`);
  return true;
}
