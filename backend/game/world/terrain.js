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

export function getTerrainHeight(x, z) {
  const rollingHill = Math.sin(x * 0.075) * 0.95 + Math.cos(z * 0.068) * 0.82;
  const smoothDrift = Math.sin((x + z) * 0.042) * 0.48;
  const iceShelf = Math.cos((x - z) * 0.12) * 0.12;

  return rollingHill + smoothDrift + iceShelf;
}

export function clampToWorld(value) {
  return value;
}

function createTerrainChunkMesh(chunkX, chunkZ) {
  const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SEGMENTS, CHUNK_SEGMENTS);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = [];
  const snow = new THREE.Color(0xf5fbff);
  const blueShadow = new THREE.Color(0x9fc9df);
  const iceHighlight = new THREE.Color(0xd9f2ff);
  const centerX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
  const centerZ = chunkZ * CHUNK_SIZE + CHUNK_SIZE / 2;
  const random = createChunkRandom(chunkX, chunkZ, 17);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) + centerX;
    const z = positions.getZ(i) + centerZ;
    const height = getTerrainHeight(x, z);
    const colorNoise = (random() - 0.5) * 0.25;
    const colorMix = clamp((height + 2) / 4 + colorNoise, 0, 1);
    const color = blueShadow.clone().lerp(snow, colorMix).lerp(iceHighlight, Math.max(0, colorNoise) * 0.35);

    positions.setY(i, height);
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: false,
    roughness: 0.9
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(centerX, 0, centerZ);
  mesh.receiveShadow = true;
  mesh.userData.chunk = { x: chunkX, z: chunkZ };
  return mesh;
}

function createSnowEffect(scene) {
  const particleCount = 900;
  const range = 90;
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * range;
    positions[i * 3 + 1] = Math.random() * 35 + 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * range;
    speeds[i] = 0.045 + Math.random() * 0.045;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.08,
    transparent: true,
    opacity: 0.78,
    depthWrite: false
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    update(playerPosition) {
      for (let i = 0; i < particleCount; i++) {
        const index = i * 3;
        positions[index] += Math.sin(i * 12.9898) * 0.012;
        positions[index + 1] -= speeds[i];
        positions[index + 2] += Math.cos(i * 78.233) * 0.01;

        if (positions[index + 1] < playerPosition.y - 1) {
          positions[index] = playerPosition.x + (Math.random() - 0.5) * range;
          positions[index + 1] = playerPosition.y + Math.random() * 28 + 12;
          positions[index + 2] = playerPosition.z + (Math.random() - 0.5) * range;
        }
      }

      geometry.attributes.position.needsUpdate = true;
    }
  };
}

export function createTerrain(scene) {
  const chunks = new Map();
  const removedResourceIds = new Set();
  const snowEffect = createSnowEffect(scene);

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
    const needed = new Set();

    for (let x = playerChunkX - LOAD_RADIUS; x <= playerChunkX + LOAD_RADIUS; x++) {
      for (let z = playerChunkZ - LOAD_RADIUS; z <= playerChunkZ + LOAD_RADIUS; z++) {
        needed.add(getChunkKey(x, z));
        loadChunk(x, z);
      }
    }

    for (const [key, chunk] of chunks) {
      const distance = Math.max(Math.abs(chunk.x - playerChunkX), Math.abs(chunk.z - playerChunkZ));
      if (distance > UNLOAD_RADIUS) {
        unloadChunk(key);
      }
    }

    snowEffect.update(playerPosition);
  }

  const terrain = {
    getHeight: getTerrainHeight,
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

function createBlock(scene, terrain, x, z, color) {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85 })
  );
  block.position.set(x, terrain.getHeight(x, z) + 0.5, z);
  block.castShadow = true;
  block.receiveShadow = true;
  scene.add(block);
}

export function createBlockPatch(scene, terrain) {
  const snowColor = 0xf5fbff;
  const iceRockColor = 0x8da9b8;

  for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
      if ((x + z) % 5 === 0) {
        createBlock(scene, terrain, x, z, iceRockColor);
      } else if (Math.random() > 0.25) {
        createBlock(scene, terrain, x, z, snowColor);
      }
    }
  }
}
