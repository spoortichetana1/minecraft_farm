import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const BUILD_RANGE = 7;
const BLOCK_SIZE = 1;
const LIGHT_PROTECTION_RANGE = 7;
const SHELTER_PROTECTION_RADIUS = 12;

export const BUILDABLE_BLOCKS = [
  { type: "grass", label: "Grass", color: 0x2f9e44 },
  { type: "dirt", label: "Dirt", color: 0x8b5a2b },
  { type: "wood", label: "Wood", color: 0x9c6a3a },
  { type: "stone", label: "Stone", color: 0x7a7d82 },
  { type: "farmland", label: "Farmland", color: 0x6b4423, height: 0.18 },
  { type: "lantern", label: "Lantern", color: 0xffc857, height: 0.55, lightSource: true }
];

const BLOCK_BY_TYPE = Object.fromEntries(BUILDABLE_BLOCKS.map((block) => [block.type, block]));

function keyForCell(cell) {
  return `${cell.x},${cell.level},${cell.z}`;
}

function cellKey(x, level, z) {
  return `${x},${level},${z}`;
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

function createBlockLight(type) {
  if (!BLOCK_BY_TYPE[type]?.lightSource) return null;

  const light = new THREE.PointLight(0xffb347, 1.35, LIGHT_PROTECTION_RANGE * 2.1, 1.35);
  light.castShadow = true;
  light.shadow.mapSize.width = 512;
  light.shadow.mapSize.height = 512;
  return light;
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

function isInsidePlayer(cell, player, terrain, blockType) {
  const playerPosition = player.mesh.position;
  const block = BLOCK_BY_TYPE[blockType];
  const blockCenter = getCellPosition(terrain, cell, blockType);
  const halfHeight = (block.height ?? BLOCK_SIZE) / 2;
  const overlapsX = Math.abs(blockCenter.x - playerPosition.x) < 0.75;
  const overlapsZ = Math.abs(blockCenter.z - playerPosition.z) < 0.75;
  const overlapsY = playerPosition.y < blockCenter.y + halfHeight + 1.7 && playerPosition.y + 1.7 > blockCenter.y - halfHeight;

  return overlapsX && overlapsY && overlapsZ;
}

export function createBuildingSystem(scene, terrain, farming) {
  const raycaster = new THREE.Raycaster();
  const screenCenter = new THREE.Vector2(0, 0);
  const blocks = new Map();
  const previewMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.8
  });
  const preview = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.04, 1.04, 1.04)),
    previewMaterial
  );

  preview.visible = false;
  scene.add(preview);

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
    const light = createBlockLight(type);
    if (light) {
      light.position.copy(mesh.position).add(new THREE.Vector3(0, 0.35, 0));
      scene.add(light);
    }

    blocks.set(keyForCell(cell), { type, cell, mesh, light });

    if (type === "farmland" && cell.level === 0) {
      farming?.addFarmlandPlot(cell.x, cell.z, mesh);
    }

    return true;
  }

  function getPlacementPreview(camera, player, selected) {
    const hit = raycast(camera, true);
    if (!hit) return { valid: false, cell: null };

    const cell = getPlacementCell(hit);
    const key = keyForCell(cell);
    const occupied = blocks.has(key);
    const insidePlayer = isInsidePlayer(cell, player, terrain, selected.type);

    return {
      valid: !occupied && !insidePlayer,
      cell,
      occupied,
      insidePlayer
    };
  }

  function removeBlock(block) {
    if (block.type === "farmland" && block.cell.level === 0) {
      farming?.removeFarmlandPlot(block.cell.x, block.cell.z, { keepMesh: true });
    }

    if (block.mesh.parent) {
      block.mesh.parent.remove(block.mesh);
    }
    if (block.light?.parent) {
      block.light.parent.remove(block.light);
    }
    blocks.delete(keyForCell(block.cell));
  }

  function hasBlockAt(x, level, z) {
    return blocks.has(cellKey(x, level, z));
  }

  function hasWallNear(x, z, offsets) {
    return offsets.some((offset) => (
      hasBlockAt(x + offset.x, 0, z + offset.z)
      || hasBlockAt(x + offset.x, 1, z + offset.z)
    ));
  }

  function isPositionNearLight(position, range = LIGHT_PROTECTION_RANGE) {
    return [...blocks.values()].some((block) => {
      if (!BLOCK_BY_TYPE[block.type]?.lightSource) return false;

      return block.mesh.position.distanceTo(position) <= range;
    });
  }

  function isShelteredCell(x, z) {
    const north = hasWallNear(x, z, [{ x: 0, z: -1 }, { x: 0, z: -2 }]);
    const south = hasWallNear(x, z, [{ x: 0, z: 1 }, { x: 0, z: 2 }]);
    const west = hasWallNear(x, z, [{ x: -1, z: 0 }, { x: -2, z: 0 }]);
    const east = hasWallNear(x, z, [{ x: 1, z: 0 }, { x: 2, z: 0 }]);
    const roof = hasBlockAt(x, 2, z) || hasBlockAt(x, 3, z);

    return north && south && west && east && roof;
  }

  return {
    place(camera, player, hotbar, hud) {
      const selected = hotbar.getSelectedItem();
      const target = getPlacementPreview(camera, player, selected);

      if (!target.cell) {
        hud.setStatus("Aim at terrain or a block");
        return false;
      }

      if (target.occupied) {
        hud.setStatus("Block already occupied");
        return true;
      }

      if (target.insidePlayer) {
        hud.setStatus("Cannot place block inside player");
        return true;
      }

      addBlock(selected.type, target.cell);
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
    isPlayerSheltered(player) {
      const x = Math.round(player.mesh.position.x);
      const z = Math.round(player.mesh.position.z);

      return isShelteredCell(x, z);
    },
    isPlayerProtected(player) {
      return this.isPlayerSheltered(player) && isPositionNearLight(player.mesh.position);
    },
    isPositionNearLight,
    getShelterProtectionAt(position) {
      const x = Math.round(position.x);
      const z = Math.round(position.z);
      const sheltered = isShelteredCell(x, z);
      const lit = isPositionNearLight(position);

      return {
        protected: sheltered && lit,
        sheltered,
        lit,
        radius: SHELTER_PROTECTION_RADIUS
      };
    },
    update(camera, player, hotbar) {
      const selected = hotbar.getSelectedItem();
      const target = getPlacementPreview(camera, player, selected);

      preview.visible = Boolean(target.cell);
      if (!target.cell) return;

      preview.position.copy(getCellPosition(terrain, target.cell, selected.type));
      previewMaterial.color.setHex(target.valid ? 0xffffff : 0xff5544);
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
