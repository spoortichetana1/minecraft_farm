import { THREE } from "../rendering/scene.js";

function markShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function createTree(scene, terrain, x, z) {
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
  scene.add(tree);

  return {
    type: "tree",
    resource: "wood",
    health: 3,
    mesh: tree,
    alive: true
  };
}

export function spawnTrees(scene, terrain, count) {
  const resources = [];

  for (let i = 0; i < count; i++) {
    const x = Math.random() * 42 - 21;
    const z = Math.random() * 42 - 21;

    if (Math.abs(x) < 4 && Math.abs(z - 7) < 4) continue;
    resources.push(createTree(scene, terrain, x, z));
  }

  return resources;
}

export function interactWithResources(resources, player, inventory, hud) {
  let nearest = null;
  let nearestDistance = Infinity;
  const playerPosition = player.mesh.position;

  for (const resource of resources) {
    if (!resource.alive) continue;

    const distance = playerPosition.distanceTo(resource.mesh.position);
    if (distance < nearestDistance) {
      nearest = resource;
      nearestDistance = distance;
    }
  }

  if (!nearest || nearestDistance > 2.4) {
    hud.setStatus("No tree in reach");
    return false;
  }

  nearest.health--;
  nearest.mesh.scale.setScalar(0.92 + nearest.health * 0.03);

  if (nearest.health > 0) {
    hud.setStatus("Chopping tree...");
    return true;
  }

  nearest.alive = false;
  nearest.mesh.parent.remove(nearest.mesh);
  inventory.addItem(nearest.resource, 2);
  hud.setStatus("+2 wood");
  return true;
}
