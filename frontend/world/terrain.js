import { THREE } from "../rendering/scene.js";

export const WORLD_LIMIT = 24;

export function getTerrainHeight(x, z) {
  return Math.sin(x * 0.2) + Math.cos(z * 0.2);
}

export function clampToWorld(value) {
  return Math.max(-WORLD_LIMIT, Math.min(WORLD_LIMIT, value));
}

export function createTerrain(scene) {
  const geometry = new THREE.PlaneGeometry(50, 50, 100, 100);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = [];
  const grass = new THREE.Color(0x2f9e44);
  const darkGrass = new THREE.Color(0x1f6f35);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const height = getTerrainHeight(x, z);
    const colorNoise = (Math.random() - 0.5) * 0.25;
    const colorMix = Math.max(0, Math.min(1, (height + 2) / 4 + colorNoise));
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
  mesh.receiveShadow = true;
  scene.add(mesh);

  return {
    mesh,
    getHeight: getTerrainHeight,
    limit: WORLD_LIMIT,
    clamp: clampToWorld
  };
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
