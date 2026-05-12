import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { randomChoice, randomRange } from "../utils/math.js";

const SNOW_ANIMAL_COUNT = 54;
const SPAWN_RADIUS = 58;
const PLAYER_AVOID_DISTANCE = 5;

function markShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function material(color, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, emissive, roughness: 0.86 });
}

function addBox(group, size, position, color) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material(color));
  mesh.position.copy(position);
  markShadow(mesh);
  group.add(mesh);
  return mesh;
}

function addSphere(group, radius, position, color, scale = new THREE.Vector3(1, 1, 1)) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), material(color));
  mesh.position.copy(position);
  mesh.scale.copy(scale);
  markShadow(mesh);
  group.add(mesh);
  return mesh;
}

function addEye(group, position) {
  const eye = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.035, 0.02),
    material(0xbdf2ff, 0x4fc3ff)
  );
  eye.position.copy(position);
  group.add(eye);
  return eye;
}

function addLegs(group, positions, color, height, radius) {
  for (const position of positions) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 7), material(color));
    leg.position.copy(position);
    markShadow(leg);
    group.add(leg);
  }
}

function createWolf(scale) {
  const group = new THREE.Group();
  const fur = randomChoice([0x87919a, 0x6f7982, 0xb8c2c8]);

  addSphere(group, 0.32, new THREE.Vector3(0, 0.48, 0), fur, new THREE.Vector3(1.45, 0.68, 0.62));
  addBox(group, new THREE.Vector3(0.28, 0.22, 0.22), new THREE.Vector3(0.56, 0.56, 0), fur);
  addBox(group, new THREE.Vector3(0.46, 0.13, 0.13), new THREE.Vector3(-0.48, 0.5, 0), fur);
  addLegs(group, [
    new THREE.Vector3(-0.24, 0.22, 0.16),
    new THREE.Vector3(-0.24, 0.22, -0.16),
    new THREE.Vector3(0.28, 0.22, 0.16),
    new THREE.Vector3(0.28, 0.22, -0.16)
  ], 0x48525a, 0.42, 0.032);

  const eyes = [
    addEye(group, new THREE.Vector3(0.71, 0.59, 0.07)),
    addEye(group, new THREE.Vector3(0.71, 0.59, -0.07))
  ];

  group.scale.setScalar(scale);
  return { mesh: group, eyes };
}

function createPolarBear(scale) {
  const group = new THREE.Group();
  const fur = randomChoice([0xf5f3e8, 0xe6e5dc, 0xffffff]);

  addSphere(group, 0.48, new THREE.Vector3(0, 0.58, 0), fur, new THREE.Vector3(1.55, 0.82, 0.82));
  addSphere(group, 0.28, new THREE.Vector3(0.74, 0.72, 0), fur, new THREE.Vector3(1.05, 0.82, 0.82));
  addBox(group, new THREE.Vector3(0.14, 0.1, 0.1), new THREE.Vector3(0.98, 0.7, 0), 0x111111);
  addLegs(group, [
    new THREE.Vector3(-0.42, 0.25, 0.22),
    new THREE.Vector3(-0.42, 0.25, -0.22),
    new THREE.Vector3(0.42, 0.25, 0.22),
    new THREE.Vector3(0.42, 0.25, -0.22)
  ], 0xd6d5cd, 0.5, 0.065);

  const eyes = [
    addEye(group, new THREE.Vector3(0.9, 0.79, 0.08)),
    addEye(group, new THREE.Vector3(0.9, 0.79, -0.08))
  ];

  group.scale.setScalar(scale);
  return { mesh: group, eyes };
}

function createSnowRabbit(scale) {
  const group = new THREE.Group();
  const fur = randomChoice([0xffffff, 0xe8eef2, 0xdfe7ed]);

  addSphere(group, 0.24, new THREE.Vector3(0, 0.3, 0), fur, new THREE.Vector3(1.25, 0.82, 0.82));
  addSphere(group, 0.15, new THREE.Vector3(0.32, 0.42, 0), fur, new THREE.Vector3(1, 0.85, 0.85));
  addBox(group, new THREE.Vector3(0.055, 0.32, 0.045), new THREE.Vector3(0.38, 0.65, 0.08), fur);
  addBox(group, new THREE.Vector3(0.055, 0.32, 0.045), new THREE.Vector3(0.38, 0.65, -0.08), fur);
  addSphere(group, 0.09, new THREE.Vector3(-0.3, 0.28, 0), fur);

  const eyes = [
    addEye(group, new THREE.Vector3(0.45, 0.44, 0.06)),
    addEye(group, new THREE.Vector3(0.45, 0.44, -0.06))
  ];

  group.scale.setScalar(scale);
  return { mesh: group, eyes };
}

function createArcticFox(scale) {
  const group = new THREE.Group();
  const fur = randomChoice([0xf4f7f8, 0xdce5ea, 0xcbd6dc]);

  addSphere(group, 0.26, new THREE.Vector3(0, 0.36, 0), fur, new THREE.Vector3(1.35, 0.65, 0.65));
  addBox(group, new THREE.Vector3(0.22, 0.2, 0.2), new THREE.Vector3(0.48, 0.5, 0), fur);
  addBox(group, new THREE.Vector3(0.09, 0.3, 0.04), new THREE.Vector3(0.49, 0.7, 0.12), fur);
  addBox(group, new THREE.Vector3(0.09, 0.3, 0.04), new THREE.Vector3(0.49, 0.7, -0.12), fur);
  addBox(group, new THREE.Vector3(0.55, 0.16, 0.16), new THREE.Vector3(-0.5, 0.38, 0), 0xffffff);
  addLegs(group, [
    new THREE.Vector3(-0.18, 0.16, 0.13),
    new THREE.Vector3(-0.18, 0.16, -0.13),
    new THREE.Vector3(0.22, 0.16, 0.13),
    new THREE.Vector3(0.22, 0.16, -0.13)
  ], 0xc2ccd1, 0.32, 0.03);

  const eyes = [
    addEye(group, new THREE.Vector3(0.61, 0.52, 0.07)),
    addEye(group, new THREE.Vector3(0.61, 0.52, -0.07))
  ];

  group.scale.setScalar(scale);
  return { mesh: group, eyes };
}

function pickDirection() {
  const angle = Math.random() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
}

function createAnimalMesh(type, scale) {
  if (type === "polarBear") return createPolarBear(scale);
  if (type === "snowRabbit") return createSnowRabbit(scale);
  if (type === "arcticFox") return createArcticFox(scale);
  return createWolf(scale);
}

function createAnimal(scene, terrain, x, z, type, packCenter = null) {
  const scale = type === "polarBear" ? randomRange(1.25, 1.55) : randomRange(0.85, 1.14);
  const result = createAnimalMesh(type, scale);
  result.mesh.position.set(x, terrain.getHeight(x, z) + 0.02, z);
  scene.add(result.mesh);

  return {
    type,
    mesh: result.mesh,
    eyes: result.eyes,
    packCenter,
    direction: pickDirection(),
    speed: type === "polarBear" ? randomRange(0.35, 0.55) : randomRange(0.5, 0.9),
    directionTimer: randomRange(2.4, 5),
    restTimer: randomRange(2, 6),
    restDuration: 0,
    phase: Math.random() * Math.PI * 2
  };
}

function scatterPack(scene, terrain, animals, centerX, centerZ, count) {
  const packCenter = new THREE.Vector3(centerX, 0, centerZ);

  for (let i = 0; i < count; i++) {
    animals.push(createAnimal(
      scene,
      terrain,
      centerX + randomRange(-4, 4),
      centerZ + randomRange(-4, 4),
      "wolf",
      packCenter
    ));
  }
}

function chooseSoloType() {
  return randomChoice(["polarBear", "snowRabbit", "snowRabbit", "arcticFox", "arcticFox"]);
}

export function createAnimals(scene, terrain, count = SNOW_ANIMAL_COUNT) {
  const animals = [];
  const packCount = Math.max(3, Math.floor(count / 16));

  for (let i = 0; i < packCount; i++) {
    scatterPack(scene, terrain, animals, randomRange(-SPAWN_RADIUS, SPAWN_RADIUS), randomRange(-SPAWN_RADIUS, SPAWN_RADIUS), Math.floor(randomRange(3, 6)));
  }

  while (animals.length < count) {
    animals.push(createAnimal(
      scene,
      terrain,
      randomRange(-SPAWN_RADIUS, SPAWN_RADIUS),
      randomRange(-SPAWN_RADIUS, SPAWN_RADIUS),
      chooseSoloType()
    ));
  }

  return {
    update(deltaTime, context) {
      const playerPosition = context.player.mesh.position;
      const nightEyes = context.dayNight?.isNight ?? false;

      for (const animal of animals) {
        animal.phase += deltaTime * (animal.type === "polarBear" ? 3.2 : 4.4);
        animal.directionTimer -= deltaTime;
        animal.restTimer -= deltaTime;
        animal.restDuration = Math.max(0, animal.restDuration - deltaTime);

        if (animal.directionTimer <= 0) {
          if (animal.type === "wolf" && animal.packCenter) {
            const toPack = animal.packCenter.clone().sub(animal.mesh.position);
            toPack.y = 0;
            animal.direction = toPack.length() > 8 ? toPack.normalize() : pickDirection();
          } else {
            animal.direction = pickDirection();
          }
          animal.directionTimer = randomRange(2.4, 5);
        }

        if (animal.restTimer <= 0) {
          animal.restDuration = randomRange(0.8, 2.2);
          animal.restTimer = randomRange(3.5, 8);
        }

        const awayFromPlayer = animal.mesh.position.clone().sub(playerPosition);
        awayFromPlayer.y = 0;
        if (awayFromPlayer.length() < PLAYER_AVOID_DISTANCE && awayFromPlayer.lengthSq() > 0) {
          animal.direction.copy(awayFromPlayer.normalize());
          animal.restDuration = 0;
        }

        const resting = animal.restDuration > 0;
        const speed = resting ? 0 : animal.speed;
        animal.mesh.position.addScaledVector(animal.direction, speed * deltaTime);
        animal.mesh.position.x = terrain.clamp(animal.mesh.position.x);
        animal.mesh.position.z = terrain.clamp(animal.mesh.position.z);

        const groundY = terrain.getHeight(animal.mesh.position.x, animal.mesh.position.z);
        const heavyStep = Math.sin(animal.phase) * (animal.type === "polarBear" ? 0.04 : 0.025);
        animal.mesh.position.y = groundY + 0.02 + heavyStep;
        animal.mesh.rotation.x = resting ? Math.sin(animal.phase * 0.45) * 0.025 : Math.sin(animal.phase) * 0.045;
        animal.mesh.rotation.z = Math.sin(animal.phase * 0.8) * 0.025;

        for (const eye of animal.eyes) {
          eye.material.emissiveIntensity = nightEyes ? 2.2 : 0.35;
        }

        if (animal.direction.lengthSq() > 0) {
          animal.mesh.lookAt(animal.mesh.position.clone().add(animal.direction));
        }
      }
    }
  };
}
