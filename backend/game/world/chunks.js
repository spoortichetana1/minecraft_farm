export const CHUNK_SIZE = 16;
export const CHUNK_SEGMENTS = 16;
export const LOAD_RADIUS = 2;
export const UNLOAD_RADIUS = 3;

export function getChunkCoord(value) {
  return Math.floor(value / CHUNK_SIZE);
}

export function getChunkKey(chunkX, chunkZ) {
  return `${chunkX},${chunkZ}`;
}

// Small deterministic hash so each chunk gets stable procedural decoration.
export function createChunkRandom(chunkX, chunkZ, salt = 0) {
  let seed = ((chunkX * 73856093) ^ (chunkZ * 19349663) ^ (salt * 83492791)) >>> 0;

  return function random() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
