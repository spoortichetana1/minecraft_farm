import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const BUILD_RANGE = 7;
const BLOCK_SIZE = 1;

export const BUILDABLE_BLOCKS = [
  { type: "dirt", label: "Dirt", color: 0x8b5a2b },
  { type: "grass", label: "Grass", color: 0x2f9e44 },
  { type: "wood", label: "Wood", color: 0x9c6a3a },
  { type: "stone", label: "Stone", color: 0x7a7d82 },
  { type: "farmland", label: "Farm", color: 0x6b4423, height: 0.18 }
];

const BLOCK_BY_TYPE = Object.fromEntries(BUILDABLE_BLOCKS.map((block) => [block.type, block]));

function keyForCell(cell) {
  return `${cell.x},${cell.level},${cell.z}`;
}

function getCellPosition(terrain, cell, blockType) {
  const block = BLOCK_BY_TYPE[blockType];
  const height = block.height ?? BLOCK_SIZE;
  const baseY = terrain.getHeight(cell.x, cell.z);

  return new THREE.Vector3(cell.x, baseY + cell.level * BLOCK_SIZE + height / 2, cell.z);
}

function createBlockMesh(type) {
  const block = BLOCK_BY_TYPE[type];
  const height = block.height ?? BLOCK_SIZE;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(BLOCK_SIZE, height, BLOCK_SIZE),
    new THREE.MeshStandardMaterial({ color: block.color, roughness: 0.85 })
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function getPlacementCell(hit) {
  if (hit.object.userData.buildBlock) {
    const current = hit.object.userData.buildBlock.cell;
    const normal = hit.face.normal.clone().round();

    if (normal.y > 0) return { x: current.x, z: current.z, level: current.level + 1 };
    if (normal.y < 0) return { x: current.x, z: current.z, level: Math.max(0, current.level - 1) };

    return {
      x: current.x + normal.x,
      z: current.z + normal.z,
      level: current.level
    };
  }

  return {
    x: Math.round(hit.point.x),
    z: Math.round(hit.point.z),
    level: 0
  };
}

function isInsidePlayer(cell, player) {
  const playerPosition = player.mesh.position;
  const horizontalDistance = Math.hypot(cell.x - playerPosition.x, cell.z - playerPosition.z);
  return horizontalDistance < 0.9 && Math.abs(cell.level) < 2;
}

export function createBuildingSystem(scene, terrain, farming) {
  const raycaster = new THREE.Raycaster();
  const screenCenter = new THREE.Vector2(0, 0);
  const blocks = new Map();

  function getBlockMeshes() {
    return [...blocks.values()].map((block) => block.mesh);
  }

  function raycast(camera, includeTerrain) {
    const terrainMeshes = terrain.getMeshes ? terrain.getMeshes() : [terrain.mesh];
    const targets = includeTerrain ? [...terrainMeshes, ...getBlockMeshes()] : getBlockMeshes();
    raycaster.setFromCamera(screenCenter, camera);
    return raycaster.intersectObjects(targets, false).find((hit) => hit.distance <= BUILD_RANGE) ?? null;
  }

  function addBlock(type, cell) {
    if (!BLOCK_BY_TYPE[type]) return false;

    const mesh = createBlockMesh(type);
    mesh.position.copy(getCellPosition(terrain, cell, type));
    mesh.userData.buildBlock = { type, cell };
    scene.add(mesh);

    blocks.set(keyForCell(cell), { type, cell, mesh });

    if (type === "farmland" && cell.level === 0) {
      farming.addFarmlandPlot(cell.x, cell.z, mesh);
    }

    return true;
  }

  function removeBlock(block) {
    if (block.type === "farmland" && block.cell.level === 0) {
      farming.removeFarmlandPlot(block.cell.x, block.cell.z, { keepMesh: true });
    }

    if (block.mesh.parent) {
      block.mesh.parent.remove(block.mesh);
    }
    blocks.delete(keyForCell(block.cell));
  }

  return {
    place(camera, player, hotbar, hud) {
      const selected = hotbar.getSelectedItem();
      const hit = raycast(camera, true);

      if (!hit) {
        hud.setStatus("Aim at terrain or a block");
        return false;
      }

      const cell = getPlacementCell(hit);
      const key = keyForCell(cell);

      if (blocks.has(key)) {
        hud.setStatus("Block already occupied");
        return true;
      }

      if (isInsidePlayer(cell, player)) {
        hud.setStatus("Cannot place block inside player");
        return true;
      }

      addBlock(selected.type, cell);
      hud.setStatus(`Placed ${selected.label}`);
      return true;
    },
    remove(camera, hud) {
      const hit = raycast(camera, false);
      if (!hit) return false;

      const block = hit.object.userData.buildBlock;
      if (!block) return false;

      const storedBlock = blocks.get(keyForCell(block.cell));
      if (!storedBlock) return false;

      removeBlock(storedBlock);
      hud.setStatus(`Removed ${BLOCK_BY_TYPE[block.type].label}`);
      return true;
    },
    getBlocks() {
      return [...blocks.values()];
    },
    getState() {
      return [...blocks.values()].map((block) => ({
        type: block.type,
        cell: { ...block.cell }
      }));
    },
    loadState(savedBlocks = []) {
      for (const block of [...blocks.values()]) {
        removeBlock(block);
      }

      for (const block of savedBlocks) {
        const cell = {
          x: Math.round(Number(block.cell?.x)),
          z: Math.round(Number(block.cell?.z)),
          level: Math.max(0, Math.round(Number(block.cell?.level ?? 0)))
        };

        if (!Number.isFinite(cell.x) || !Number.isFinite(cell.z) || !BLOCK_BY_TYPE[block.type]) continue;
        if (blocks.has(keyForCell(cell))) continue;

        addBlock(block.type, cell);
      }
    }
  };
}
