import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { clamp } from "../utils/math.js";
import {
  CHUNK_SEGMENTS,
  CHUNK_SIZE,
  LOAD_RADIUS,
  UNLOAD_RADIUS,
  createChunkRandom,
  getChunkCoord,
  getChunkKey
} from "./chunks.js";
import { createChunkVegetation } from "./vegetation.js";

const BIOME_SIZE = 96;

export const BIOMES = {
  FOREST: "forest",
  PLAINS: "plains",
  DESERT: "desert",
  SNOW: "snow",
  SWAMP: "swamp",
  VOLCANIC: "volcanic"
};

const BIOME_GRID = [
  [BIOMES.FOREST, BIOMES.PLAINS, BIOMES.DESERT],
  [BIOMES.SNOW, BIOMES.SWAMP, BIOMES.VOLCANIC]
];

const BIOME_PALETTES = {
  forest: [0x1f7a34, 0x2f9a43, 0x145829],
  plains: [0x51b83f, 0x77d957, 0x2f8f35],
  desert: [0xd8a84d, 0xf0c46a, 0xb8792f],
  snow: [0xf5fbff, 0x9fc9df, 0xd9f2ff],
  swamp: [0x263f20, 0x435d25, 0x5b3f25],
  volcanic: [0x151515, 0x343434, 0xff6a00]
};

export function getBiomeAt(x, z) {
  const col = ((Math.floor((x + BIOME_SIZE / 2) / BIOME_SIZE) % 3) + 3) % 3;
  const row = ((Math.floor((z + BIOME_SIZE / 2) / BIOME_SIZE) % 2) + 2) % 2;
  return BIOME_GRID[row][col];
}

export function getTerrainHeight(x, z) {
  const biome = getBiomeAt(x, z);

  if (biome === BIOMES.PLAINS) {
    return Math.sin(x * 0.045) * 0.28 + Math.cos(z * 0.05) * 0.22;
  }

  if (biome === BIOMES.DESERT) {
    return Math.sin(x * 0.06) * 0.85 + Math.cos(z * 0.052) * 0.72 + Math.sin((x + z) * 0.035) * 0.42;
  }

  if (biome === BIOMES.SNOW) {
    return Math.sin(x * 0.075) * 0.95 + Math.cos(z * 0.068) * 0.82 + Math.sin((x + z) * 0.042) * 0.48;
  }

  if (biome === BIOMES.SWAMP) {
    return Math.sin(x * 0.045) * 0.28 + Math.cos(z * 0.047) * 0.24 - 0.35;
  }

  if (biome === BIOMES.VOLCANIC) {
    return Math.sin(x * 0.09) * 1.25 + Math.cos(z * 0.08) * 1.05 + Math.sin((x - z) * 0.16) * 0.42;
  }

  return Math.sin(x * 0.075) * 0.95 + Math.cos(z * 0.068) * 0.82 + Math.sin((x + z) * 0.055) * 0.38;
}

export function clampToWorld(value) {
  return value;
}

function colorForVertex(x, z, height, random) {
  const biome = getBiomeAt(x, z);
  const [lowColor, highColor, accentColor] = BIOME_PALETTES[biome];
  const low = new THREE.Color(lowColor);
  const high = new THREE.Color(highColor);
  const accent = new THREE.Color(accentColor);
  const noise = (random() - 0.5) * 0.28;
  const mix = clamp((height + 2.2) / 4.6 + noise, 0, 1);

  if (biome === BIOMES.VOLCANIC) {
    const crack = Math.abs(Math.sin(x * 1.7) * Math.cos(z * 1.3));
    return low.lerp(high, mix * 0.72).lerp(accent, crack > 0.94 ? 0.72 : 0);
  }

  if (biome === BIOMES.SWAMP) {
    const wet = Math.max(0, 1 - Math.abs(height + 0.32) * 2.2);
    return low.lerp(high, mix * 0.65).lerp(accent, wet * 0.35);
  }

  return low.lerp(high, mix).lerp(accent, Math.max(0, noise) * 0.28);
}

function createTerrainChunkMesh(chunkX, chunkZ) {
  const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SEGMENTS, CHUNK_SEGMENTS);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = [];
  const centerX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
  const centerZ = chunkZ * CHUNK_SIZE + CHUNK_SIZE / 2;
  const random = createChunkRandom(chunkX, chunkZ, 17);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) + centerX;
    const z = positions.getZ(i) + centerZ;
    const height = getTerrainHeight(x, z);
    const color = colorForVertex(x, z, height, random);

    positions.setY(i, height);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: false,
      roughness: 0.9,
      emissive: 0x120500,
      emissiveIntensity: getBiomeAt(centerX, centerZ) === BIOMES.VOLCANIC ? 0.08 : 0
    })
  );

  mesh.position.set(centerX, 0, centerZ);
  mesh.receiveShadow = true;
  mesh.userData.chunk = { x: chunkX, z: chunkZ, biome: getBiomeAt(centerX, centerZ) };
  return mesh;
}

function createParticleEffect(scene, color, size, opacity, fallSpeed) {
  const particleCount = 760;
  const range = 90;
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * range;
    positions[i * 3 + 1] = Math.random() * 35 + 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * range;
    speeds[i] = fallSpeed * (0.65 + Math.random() * 0.7);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    depthWrite: false
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    points,
    update(playerPosition, active, upward = false) {
      points.visible = active;
      if (!active) return;

      for (let i = 0; i < particleCount; i++) {
        const index = i * 3;
        positions[index] += Math.sin(i * 12.9898) * 0.012;
        positions[index + 1] += upward ? speeds[i] : -speeds[i];
        positions[index + 2] += Math.cos(i * 78.233) * 0.01;

        if ((!upward && positions[index + 1] < playerPosition.y - 1) || (upward && positions[index + 1] > playerPosition.y + 34)) {
          positions[index] = playerPosition.x + (Math.random() - 0.5) * range;
          positions[index + 1] = upward ? playerPosition.y + randomSpawnHeight(0, 5) : playerPosition.y + randomSpawnHeight(12, 30);
          positions[index + 2] = playerPosition.z + (Math.random() - 0.5) * range;
        }
      }

      geometry.attributes.position.needsUpdate = true;
    }
  };
}

function randomSpawnHeight(min, max) {
  return min + Math.random() * (max - min);
}

function updateBiomeAtmosphere(scene, biome) {
  const settings = {
    forest: { background: 0x88cfa0, fog: 0x8bbd8d, density: 0.006 },
    plains: { background: 0x91d4f2, fog: 0xb8e0c0, density: 0.004 },
    desert: { background: 0xf1c985, fog: 0xd9a95f, density: 0.007 },
    snow: { background: 0xd6efff, fog: 0xcde6ef, density: 0.01 },
    swamp: { background: 0x35442f, fog: 0x50613d, density: 0.018 },
    volcanic: { background: 0x1a1210, fog: 0x2a1712, density: 0.018 }
  }[biome];

  scene.userData.biomeAtmosphere = settings;
  scene.background = new THREE.Color(settings.background);
  scene.fog = new THREE.FogExp2(settings.fog, settings.density);
}

export function createTerrain(scene) {
  const chunks = new Map();
  const removedResourceIds = new Set();
  const snowEffect = createParticleEffect(scene, 0xffffff, 0.08, 0.74, 0.055);
  const ashEffect = createParticleEffect(scene, 0x6f6257, 0.1, 0.42, 0.025);

  function loadChunk(chunkX, chunkZ) {
    const key = getChunkKey(chunkX, chunkZ);
    if (chunks.has(key)) return;

    const mesh = createTerrainChunkMesh(chunkX, chunkZ);
    scene.add(mesh);

    const vegetation = createChunkVegetation(
      scene,
      terrain,
      chunkX,
      chunkZ,
      createChunkRandom(chunkX, chunkZ, 41),
      removedResourceIds
    );

    chunks.set(key, {
      key,
      x: chunkX,
      z: chunkZ,
      mesh,
      vegetation
    });
  }

  function unloadChunk(key) {
    const chunk = chunks.get(key);
    if (!chunk) return;

    scene.remove(chunk.mesh);
    chunk.mesh.geometry.dispose();
    chunk.mesh.material.dispose();

    scene.remove(chunk.vegetation.group);
    chunks.delete(key);
  }

  function updateChunks(playerPosition) {
    const playerChunkX = getChunkCoord(playerPosition.x);
    const playerChunkZ = getChunkCoord(playerPosition.z);
    const biome = getBiomeAt(playerPosition.x, playerPosition.z);

    updateBiomeAtmosphere(scene, biome);

    for (let x = playerChunkX - LOAD_RADIUS; x <= playerChunkX + LOAD_RADIUS; x++) {
      for (let z = playerChunkZ - LOAD_RADIUS; z <= playerChunkZ + LOAD_RADIUS; z++) {
        loadChunk(x, z);
      }
    }

    for (const [key, chunk] of chunks) {
      const distance = Math.max(Math.abs(chunk.x - playerChunkX), Math.abs(chunk.z - playerChunkZ));
      if (distance > UNLOAD_RADIUS) {
        unloadChunk(key);
      }
    }

    snowEffect.update(playerPosition, biome === BIOMES.SNOW);
    ashEffect.update(playerPosition, biome === BIOMES.VOLCANIC, true);
  }

  const terrain = {
    getHeight: getTerrainHeight,
    getBiomeAt,
    clamp: clampToWorld,
    limit: Infinity,
    removedResourceIds,
    update: updateChunks,
    getMeshes() {
      return [...chunks.values()].map((chunk) => chunk.mesh);
    },
    getTreeResources() {
      const resources = Array.from(chunks.values()).flatMap((chunk) => chunk.vegetation.resources);
      resources.removedResourceIds = removedResourceIds;
      return resources;
    }
  };

  terrain.update(new THREE.Vector3(0, 0, 0));

  return terrain;
}

function createBlock(scene, terrain, x, z, color, emissive = 0x000000) {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, emissive, emissiveIntensity: emissive ? 0.8 : 0 })
  );
  block.position.set(x, terrain.getHeight(x, z) + 0.5, z);
  block.castShadow = true;
  block.receiveShadow = true;
  scene.add(block);
}

export function createBlockPatch(scene, terrain) {
  for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
      const biome = terrain.getBiomeAt(x, z);
      if (biome === BIOMES.VOLCANIC && (x + z) % 6 === 0) {
        createBlock(scene, terrain, x, z, 0xff5a00, 0xff2b00);
      } else if ((x + z) % 5 === 0) {
        createBlock(scene, terrain, x, z, biome === BIOMES.DESERT ? 0xb8792f : 0x5d5d5d);
      }
    }
  }
}
