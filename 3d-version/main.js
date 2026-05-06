import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// Create the scene and give it a visible sky-colored background.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Add a perspective camera looking at the center of the world.
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Simple free-camera state.
const keys = {};
const cameraDirection = new THREE.Vector3();
const forward = new THREE.Vector3();
const cameraRight = new THREE.Vector3();
const upVector = new THREE.Vector3(0, 1, 0);
const speed = 0.1;
let yaw = -Math.PI / 4;
let pitch = -0.55;
const animals = [];
const player = new THREE.Group();

// Create the WebGL renderer and attach it to the page.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Add a large green terrain plane with simple rolling hills.
const groundGeometry = new THREE.PlaneGeometry(50, 50, 100, 100);
groundGeometry.rotateX(-Math.PI / 2);

const groundPositions = groundGeometry.attributes.position;
const groundColors = [];
const grass = new THREE.Color(0x2f9e44);
const darkGrass = new THREE.Color(0x1f6f35);

for (let i = 0; i < groundPositions.count; i++) {
  const x = groundPositions.getX(i);
  const z = groundPositions.getZ(i);
  const height = getTerrainHeight(x, z);
  const colorVariation = (Math.random() - 0.5) * 0.25;
  const colorBlend = Math.max(0, Math.min(1, (height + 2) / 4 + colorVariation));
  const color = darkGrass.clone().lerp(grass, colorBlend);

  groundPositions.setY(i, height);
  groundColors.push(color.r, color.g, color.b);
}

groundGeometry.setAttribute("color", new THREE.Float32BufferAttribute(groundColors, 3));
groundGeometry.computeVertexNormals();

const groundMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: false,
  roughness: 0.9
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.receiveShadow = true;
scene.add(ground);

function getTerrainHeight(x, z) {
  return Math.sin(x * 0.2) + Math.cos(z * 0.2);
}

// Add ambient fill light and a shadow-casting sun.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
scene.add(directionalLight);

const { Config, World } = window.FarmCraft;
const { BLOCKS, WORLD_HEIGHT, WORLD_WIDTH } = Config;

// Create one block tile for the 3D terrain.
function createBlock(x, y, z, color) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshLambertMaterial({ color });
  const block = new THREE.Mesh(geometry, material);
  block.position.set(x, y, z);
  scene.add(block);
  return block;
}

// Build 3D blocks from the existing 2D world grid.
const grassColor = 0x2f9e44;
const dirtColor = 0x8b5a2b;
const { world } = World.generateWorld();
const terrainOffsetX = WORLD_WIDTH / 2;
const terrainOffsetY = WORLD_HEIGHT / 2;

for (let y = 0; y < WORLD_HEIGHT; y++) {
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const tile = world[y][x];

    if (tile === BLOCKS.GRASS) {
      createBlock(x - terrainOffsetX, terrainOffsetY - y, 0, grassColor);
    } else if (tile === BLOCKS.DIRT) {
      createBlock(x - terrainOffsetX, terrainOffsetY - y, 0, dirtColor);
    }
  }
}

function createStickman() {
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2f6fed, roughness: 0.75 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd2a6, roughness: 0.75 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMaterial);
  head.position.y = 1.65;
  player.add(head);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.75, 12), bodyMaterial);
  body.position.y = 1.1;
  player.add(body);

  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 8), bodyMaterial);
  leftArm.position.set(-0.35, 1.15, 0);
  leftArm.rotation.z = -0.45;
  player.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 8), bodyMaterial);
  rightArm.position.set(0.35, 1.15, 0);
  rightArm.rotation.z = 0.45;
  player.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.8, 8), bodyMaterial);
  leftLeg.position.set(-0.12, 0.4, 0);
  leftLeg.rotation.z = 0.12;
  player.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.8, 8), bodyMaterial);
  rightLeg.position.set(0.12, 0.4, 0);
  rightLeg.rotation.z = -0.12;
  player.add(rightLeg);

  player.traverse((part) => {
    if (part.isMesh) {
      part.castShadow = true;
      part.receiveShadow = true;
    }
  });

  player.position.set(0, getTerrainHeight(0, 0) + 0.05, 6);
  scene.add(player);
}

createStickman();

function createAnimal(color) {
  const animal = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.45), material);
  body.position.y = 0.35;
  body.castShadow = true;
  body.receiveShadow = true;
  animal.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), material);
  head.position.set(0.5, 0.48, 0);
  head.castShadow = true;
  head.receiveShadow = true;
  animal.add(head);

  scene.add(animal);
  return animal;
}

function pickAnimalDirection() {
  const angle = Math.random() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
}

function spawnAnimals(count) {
  const colors = [0xffffff, 0x8b5a2b, 0xd9c2a3, 0x222222];

  for (let i = 0; i < count; i++) {
    const x = Math.random() * 36 - 18;
    const z = Math.random() * 36 - 18;
    const animal = createAnimal(colors[Math.floor(Math.random() * colors.length)]);

    animal.position.set(x, getTerrainHeight(x, z) + 0.25, z);
    animals.push({
      mesh: animal,
      direction: pickAnimalDirection(),
      speed: 0.015 + Math.random() * 0.015,
      directionTimer: 120 + Math.floor(Math.random() * 180)
    });
  }
}

function updateAnimals() {
  for (const animal of animals) {
    animal.directionTimer--;

    if (animal.directionTimer <= 0) {
      animal.direction = pickAnimalDirection();
      animal.directionTimer = 120 + Math.floor(Math.random() * 180);
    }

    animal.mesh.position.addScaledVector(animal.direction, animal.speed);
    animal.mesh.position.x = Math.max(-24, Math.min(24, animal.mesh.position.x));
    animal.mesh.position.z = Math.max(-24, Math.min(24, animal.mesh.position.z));
    animal.mesh.position.y = getTerrainHeight(animal.mesh.position.x, animal.mesh.position.z) + 0.25;
    animal.mesh.lookAt(animal.mesh.position.clone().add(animal.direction));
  }
}

spawnAnimals(12);

function createFlower(x, z, color) {
  const flower = new THREE.Group();
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.9 });
  const topMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 6), stemMaterial);
  stem.position.y = 0.175;
  flower.add(stem);

  const top = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), topMaterial);
  top.position.y = 0.4;
  flower.add(top);

  flower.position.set(x, getTerrainHeight(x, z), z);
  scene.add(flower);
}

function scatterWildflowers(count) {
  const colors = [0xff3b30, 0xffd60a, 0xffffff, 0x9b5de5];

  for (let i = 0; i < count; i++) {
    const x = Math.random() * 48 - 24;
    const z = Math.random() * 48 - 24;
    const color = colors[Math.floor(Math.random() * colors.length)];

    createFlower(x, z, color);
  }
}

scatterWildflowers(140);

// Click the canvas to capture the mouse for camera rotation.
renderer.domElement.addEventListener("click", () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener("keydown", (event) => {
  keys[event.code] = true;
});

document.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== renderer.domElement) return;

  yaw -= event.movementX * 0.002;
  pitch -= event.movementY * 0.002;
  pitch = Math.max(-1.4, Math.min(1.4, pitch));
});

function updateCameraControls() {
  cameraDirection.set(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch)
  ).normalize();

  // Movement uses the camera's horizontal facing direction so WASD moves the player.
  forward.set(cameraDirection.x, 0, cameraDirection.z).normalize();
  cameraRight.crossVectors(forward, upVector).normalize();

  const moveDirection = new THREE.Vector3();
  if (keys.KeyW) moveDirection.add(forward);
  if (keys.KeyS) moveDirection.addScaledVector(forward, -1);
  if (keys.KeyA) moveDirection.add(cameraRight);
  if (keys.KeyD) moveDirection.addScaledVector(cameraRight, -1);

  if (moveDirection.lengthSq() > 0) {
    moveDirection.normalize();
    player.position.addScaledVector(moveDirection, speed);
    player.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
  }

  player.position.y = getTerrainHeight(player.position.x, player.position.z) + 0.05;

  const cameraTarget = player.position.clone().add(new THREE.Vector3(0, 1.15, 0));
  const followPosition = player.position.clone()
    .addScaledVector(forward, -5)
    .add(new THREE.Vector3(0, 2.8 + pitch, 0));

  camera.position.lerp(followPosition, 0.12);
  camera.lookAt(cameraTarget);
}

// Keep the scene sized correctly when the browser window changes.
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Render loop.
function animate() {
  requestAnimationFrame(animate);
  updateCameraControls();
  updateAnimals();
  renderer.render(scene, camera);
}

animate();
