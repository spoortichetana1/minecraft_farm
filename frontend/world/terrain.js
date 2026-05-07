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
  return Math.sin(x * 0.2) + Math.cos(z * 0.2);
}

export function clampToWorld(value) {
  return value;
}

function createTerrainChunkMesh(chunkX, chunkZ) {
  const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, CHUNK_SEGMENTS, CHUNK_SEGMENTS);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = [];
  const grass = new THREE.Color(0x2f9e44);
  const darkGrass = new THREE.Color(0x1f6f35);
  const centerX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
  const centerZ = chunkZ * CHUNK_SIZE + CHUNK_SIZE / 2;
  const random = createChunkRandom(chunkX, chunkZ, 17);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) + centerX;
    const z = positions.getZ(i) + centerZ;
    const height = getTerrainHeight(x, z);
    const colorNoise = (random() - 0.5) * 0.25;
    const colorMix = clamp((height + 2) / 4 + colorNoise, 0, 1);
    const color = darkGrass.clone().lerp(grass, colorMix);

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

export function createTerrain(scene) {
  const chunks = new Map();
  const removedResourceIds = new Set();

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
  const grassColor = 0x2f9e44;
  const dirtColor = 0x8b5a2b;

  for (let x = -5; x <= 5; x++) {
    for (let z = -5; z <= 5; z++) {
      if ((x + z) % 5 === 0) {
        createBlock(scene, terrain, x, z, dirtColor);
      } else if (Math.random() > 0.25) {
        createBlock(scene, terrain, x, z, grassColor);
      }
    }
  }
}
