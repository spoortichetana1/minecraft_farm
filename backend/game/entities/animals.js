import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { randomChoice, randomRange } from "../utils/math.js";

const ANIMAL_COUNT = 72;
const SPAWN_RADIUS = 135;
const PLAYER_AVOID_DISTANCE = 5;
const HOSTILE_DETECT_RANGE = 26;
const HOSTILE_TOUCH_RANGE = 1.25;
const HOSTILE_DAMAGE = 8;

function markShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function material(color, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness: 0.82 });
}

function addBox(group, size, position, color, emissive = 0x000000, emissiveIntensity = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material(color, emissive, emissiveIntensity));
  mesh.position.copy(position);
  markShadow(mesh);
  group.add(mesh);
  return mesh;
}

function addSphere(group, radius, position, color, scale = new THREE.Vector3(1, 1, 1), emissive = 0x000000, emissiveIntensity = 0) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), material(color, emissive, emissiveIntensity));
  mesh.position.copy(position);
  mesh.scale.copy(scale);
  markShadow(mesh);
  group.add(mesh);
  return mesh;
}

function addLegs(group, positions, color, height, radius) {
  for (const position of positions) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 7), material(color));
    leg.position.copy(position);
    markShadow(leg);
    group.add(leg);
  }
}

function addEyes(group, x, y, spread, color = 0xff2b00) {
  return [
    addBox(group, new THREE.Vector3(0.05, 0.035, 0.025), new THREE.Vector3(x, y, spread), color, color, 2.4),
    addBox(group, new THREE.Vector3(0.05, 0.035, 0.025), new THREE.Vector3(x, y, -spread), color, color, 2.4)
  ];
}

function createQuadruped(scale, colors, options = {}) {
  const group = new THREE.Group();
  addSphere(group, 0.36, new THREE.Vector3(0, 0.48, 0), colors.body, new THREE.Vector3(options.longBody ?? 1.35, 0.68, 0.62));
  addSphere(group, 0.18, new THREE.Vector3(0.48, 0.58, 0), colors.head, new THREE.Vector3(1, 0.85, 0.85));
  addLegs(group, [
    new THREE.Vector3(-0.25, 0.22, 0.16),
    new THREE.Vector3(-0.25, 0.22, -0.16),
    new THREE.Vector3(0.25, 0.22, 0.16),
    new THREE.Vector3(0.25, 0.22, -0.16)
  ], colors.legs ?? colors.body, options.legHeight ?? 0.42, options.legRadius ?? 0.035);
  if (options.tail) addBox(group, new THREE.Vector3(0.45, 0.12, 0.12), new THREE.Vector3(-0.48, 0.48, 0), colors.tail ?? colors.body);
  group.scale.setScalar(scale);
  return { mesh: group, glowParts: [] };
}

function createBird(scale, color = 0x8f8f8f) {
  const group = new THREE.Group();
  addSphere(group, 0.16, new THREE.Vector3(0, 0.2, 0), color, new THREE.Vector3(1.2, 0.8, 0.75));
  addBox(group, new THREE.Vector3(0.4, 0.035, 0.16), new THREE.Vector3(0, 0.22, 0.2), color);
  addBox(group, new THREE.Vector3(0.4, 0.035, 0.16), new THREE.Vector3(0, 0.22, -0.2), color);
  group.scale.setScalar(scale);
  return { mesh: group, glowParts: [] };
}

function createLavaLizard(scale) {
  const group = new THREE.Group();
  const glowParts = [];
  addSphere(group, 0.28, new THREE.Vector3(0, 0.24, 0), 0x241a14, new THREE.Vector3(1.9, 0.38, 0.45), 0x321000, 0.25);
  addSphere(group, 0.16, new THREE.Vector3(0.58, 0.28, 0), 0x1b1412, new THREE.Vector3(1.1, 0.65, 0.65), 0x321000, 0.2);
  addBox(group, new THREE.Vector3(0.72, 0.08, 0.08), new THREE.Vector3(-0.55, 0.24, 0), 0x17110f, 0x2b0800, 0.2);
  addLegs(group, [
    new THREE.Vector3(-0.22, 0.1, 0.18),
    new THREE.Vector3(-0.22, 0.1, -0.18),
    new THREE.Vector3(0.28, 0.1, 0.18),
    new THREE.Vector3(0.28, 0.1, -0.18)
  ], 0x120d0b, 0.2, 0.025);
  for (let i = 0; i < 4; i++) {
    glowParts.push(addBox(group, new THREE.Vector3(0.04, 0.028, 0.23), new THREE.Vector3(-0.3 + i * 0.18, 0.4, 0), 0xff5a00, 0xff2b00, 1.8));
  }
  glowParts.push(...addEyes(group, 0.71, 0.32, 0.07));
  group.scale.setScalar(scale);
  return { mesh: group, glowParts };
}

function createAshWolf(scale) {
  const group = new THREE.Group();
  const glowParts = [];
  addSphere(group, 0.34, new THREE.Vector3(0, 0.48, 0), 0x181818, new THREE.Vector3(1.55, 0.72, 0.65), 0x240600, 0.25);
  addBox(group, new THREE.Vector3(0.32, 0.24, 0.22), new THREE.Vector3(0.58, 0.58, 0), 0x111111, 0x240600, 0.2);
  addBox(group, new THREE.Vector3(0.46, 0.13, 0.13), new THREE.Vector3(-0.5, 0.5, 0), 0x151515);
  addLegs(group, [
    new THREE.Vector3(-0.26, 0.22, 0.16),
    new THREE.Vector3(-0.26, 0.22, -0.16),
    new THREE.Vector3(0.3, 0.22, 0.16),
    new THREE.Vector3(0.3, 0.22, -0.16)
  ], 0x0d0d0d, 0.42, 0.035);
  glowParts.push(addBox(group, new THREE.Vector3(0.08, 0.02, 0.48), new THREE.Vector3(0.03, 0.82, 0), 0xff4a00, 0xff2600, 1.6));
  glowParts.push(...addEyes(group, 0.75, 0.62, 0.075));
  group.scale.setScalar(scale);
  return { mesh: group, glowParts };
}

function createFireInsect(scale) {
  const group = new THREE.Group();
  const glowParts = [];
  glowParts.push(addSphere(group, 0.16, new THREE.Vector3(0, 0.24, 0), 0xff5a00, new THREE.Vector3(1.2, 0.85, 0.85), 0xff2b00, 1.9));
  glowParts.push(addSphere(group, 0.1, new THREE.Vector3(0.2, 0.27, 0), 0x2a1710, new THREE.Vector3(1, 0.8, 0.8), 0xff2600, 0.8));
  addBox(group, new THREE.Vector3(0.34, 0.025, 0.18), new THREE.Vector3(0, 0.3, 0.22), 0x6f4a29, 0xff7a00, 0.35);
  addBox(group, new THREE.Vector3(0.34, 0.025, 0.18), new THREE.Vector3(0, 0.3, -0.22), 0x6f4a29, 0xff7a00, 0.35);
  group.scale.setScalar(scale);
  return { mesh: group, glowParts };
}

function createBiomeAnimalMesh(type, scale) {
  if (type === "deer") return createQuadruped(scale, { body: 0x8b5a32, head: 0x9a673c, legs: 0x5f3a22 }, { tail: true, legHeight: 0.55 });
  if (type === "rabbit") return createQuadruped(scale, { body: 0xd8d0c2, head: 0xe6dfd2, legs: 0xc0b6a7 }, { longBody: 1.1, legHeight: 0.25, legRadius: 0.025 });
  if (type === "fox") return createQuadruped(scale, { body: 0xb55f28, head: 0xc86c2c, legs: 0x342018, tail: 0xe8d4b6 }, { tail: true });
  if (type === "chicken") return createBird(scale, 0xf4f0df);
  if (type === "cow") return createQuadruped(scale, { body: 0xf0eee8, head: 0x2b2b2b, legs: 0x2b2b2b }, { longBody: 1.6, legHeight: 0.46, legRadius: 0.045, tail: true });
  if (type === "sheep") return createQuadruped(scale, { body: 0xf3f3ec, head: 0x2b2b2b, legs: 0x2b2b2b }, { longBody: 1.25, legHeight: 0.36, legRadius: 0.04 });
  if (type === "horse") return createQuadruped(scale, { body: 0x7a4a28, head: 0x6d3e22, legs: 0x3a2418 }, { longBody: 1.65, legHeight: 0.7, legRadius: 0.04, tail: true });
  if (type === "lizard") return createQuadruped(scale, { body: 0xb88a45, head: 0xc69b58, legs: 0x8e6f3e }, { longBody: 1.65, legHeight: 0.16, legRadius: 0.025, tail: true });
  if (type === "snake") return { mesh: new THREE.Group(), glowParts: [], snake: true };
  if (type === "vulture") return createBird(scale, 0x4a403a);
  if (type === "wolf") return createQuadruped(scale, { body: 0x778089, head: 0x677079, legs: 0x48525a }, { tail: true });
  if (type === "polarBear") return createQuadruped(scale, { body: 0xf5f3e8, head: 0xffffff, legs: 0xd6d5cd }, { longBody: 1.55, legHeight: 0.5, legRadius: 0.065 });
  if (type === "frog") return createQuadruped(scale, { body: 0x4a8f3a, head: 0x5ba144, legs: 0x3e7330 }, { longBody: 1, legHeight: 0.2, legRadius: 0.035 });
  if (type === "crocodile") return createQuadruped(scale, { body: 0x2f5132, head: 0x365c35, legs: 0x263f25 }, { longBody: 2.0, legHeight: 0.18, legRadius: 0.035, tail: true });
  if (type === "swampBird") return createBird(scale, 0x7f8666);
  if (type === "lavaLizard") return createLavaLizard(scale);
  if (type === "ashWolf") return createAshWolf(scale);
  if (type === "fireInsect") return createFireInsect(scale);
  return createQuadruped(scale, { body: 0x8b5a32, head: 0x9a673c, legs: 0x5f3a22 });
}

function pickDirection() {
  const angle = Math.random() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
}

function typeForBiome(biome) {
  const choices = {
    forest: ["deer", "deer", "rabbit", "fox", "chicken", "vulture"],
    plains: ["cow", "cow", "sheep", "sheep", "horse", "chicken"],
    desert: ["lizard", "snake", "desertFox", "vulture"],
    snow: ["wolf", "wolf", "polarBear", "rabbit", "fox"],
    swamp: ["frog", "frog", "crocodile", "swampBird", "fireInsect"],
    volcanic: ["lavaLizard", "lavaLizard", "ashWolf", "fireInsect", "fireInsect"]
  };
  const picked = randomChoice(choices[biome] ?? choices.forest);
  return picked === "desertFox" ? "fox" : picked;
}

function scaleForType(type) {
  if (type === "polarBear") return randomRange(1.25, 1.55);
  if (type === "horse" || type === "cow") return randomRange(1.05, 1.28);
  if (type === "rabbit" || type === "frog" || type === "fireInsect") return randomRange(0.65, 0.95);
  if (type === "lavaLizard") return randomRange(0.9, 1.25);
  if (type === "ashWolf") return randomRange(0.98, 1.25);
  return randomRange(0.85, 1.14);
}

function createSnakeMesh(scale) {
  const group = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    addSphere(group, 0.11, new THREE.Vector3(i * 0.17, 0.1, Math.sin(i) * 0.04), 0x9b7a3e, new THREE.Vector3(1.15, 0.55, 0.85));
  }
  group.scale.setScalar(scale);
  return { mesh: group, glowParts: [] };
}

function createAnimal(scene, terrain, x, z, type) {
  const biome = terrain.getBiomeAt(x, z);
  const scale = scaleForType(type);
  const result = type === "snake" ? createSnakeMesh(scale) : createBiomeAnimalMesh(type, scale);
  const flying = ["vulture", "swampBird", "fireInsect"].includes(type);
  const hostile = biome === "volcanic";

  result.mesh.position.set(x, terrain.getHeight(x, z) + (flying ? randomRange(2.4, 5.5) : 0.02), z);
  scene.add(result.mesh);

  return {
    type,
    biome,
    mesh: result.mesh,
    glowParts: result.glowParts ?? [],
    direction: pickDirection(),
    speed: hostile ? randomRange(1.15, 1.75) : randomRange(0.35, 0.9),
    directionTimer: randomRange(2.4, 5),
    restTimer: randomRange(2, 6),
    restDuration: 0,
    phase: Math.random() * Math.PI * 2,
    flying,
    hostile
  };
}

function biomeSpawnPoint(terrain, targetBiome) {
  for (let i = 0; i < 80; i++) {
    const x = randomRange(-SPAWN_RADIUS, SPAWN_RADIUS);
    const z = randomRange(-SPAWN_RADIUS, SPAWN_RADIUS);
    if (terrain.getBiomeAt(x, z) === targetBiome) return { x, z };
  }
  return { x: randomRange(-SPAWN_RADIUS, SPAWN_RADIUS), z: randomRange(-SPAWN_RADIUS, SPAWN_RADIUS) };
}

function populateBiome(scene, terrain, animals, biome, count) {
  for (let i = 0; i < count; i++) {
    const point = biomeSpawnPoint(terrain, biome);
    animals.push(createAnimal(scene, terrain, point.x, point.z, typeForBiome(biome)));
  }
}

export function createAnimals(scene, terrain, count = ANIMAL_COUNT) {
  const animals = [];
  const perBiome = Math.max(6, Math.floor(count / 6));

  for (const biome of ["forest", "plains", "desert", "snow", "swamp", "volcanic"]) {
    populateBiome(scene, terrain, animals, biome, perBiome);
  }

  return {
    update(deltaTime, context) {
      const playerPosition = context.player.mesh.position;
      const isNight = context.dayNight?.isNight ?? false;

      for (const animal of animals) {
        animal.phase += deltaTime * (animal.hostile ? 6.2 : 4.2);
        animal.directionTimer -= deltaTime;
        animal.restTimer -= deltaTime;
        animal.restDuration = Math.max(0, animal.restDuration - deltaTime);

        const toPlayer = playerPosition.clone().sub(animal.mesh.position);
        toPlayer.y = 0;
        const playerDistance = toPlayer.length();

        if (animal.hostile && playerDistance < HOSTILE_DETECT_RANGE && playerDistance > 0.01) {
          animal.direction.copy(toPlayer.normalize());
          animal.restDuration = 0;
        } else if (playerDistance < PLAYER_AVOID_DISTANCE && playerDistance > 0.01 && !animal.hostile) {
          animal.direction.copy(animal.mesh.position.clone().sub(playerPosition).setY(0).normalize());
          animal.restDuration = 0;
        } else if (animal.directionTimer <= 0) {
          animal.direction = pickDirection();
          animal.directionTimer = randomRange(2.4, 5);
        }

        if (!animal.hostile && animal.restTimer <= 0) {
          animal.restDuration = randomRange(0.8, 2.2);
          animal.restTimer = randomRange(3.5, 8);
        }

        const resting = animal.restDuration > 0;
        const speedBoost = animal.hostile && isNight ? 1.55 : 1;
        const speed = resting ? 0 : animal.speed * speedBoost;
        animal.mesh.position.addScaledVector(animal.direction, speed * deltaTime);

        const groundY = terrain.getHeight(animal.mesh.position.x, animal.mesh.position.z);
        const bob = Math.sin(animal.phase) * (animal.flying ? 0.18 : animal.hostile ? 0.055 : 0.035);
        animal.mesh.position.y = groundY + (animal.flying ? 3.4 : 0.02) + bob;
        animal.mesh.rotation.x = Math.sin(animal.phase * 0.8) * (animal.hostile ? 0.06 : 0.035);
        animal.mesh.rotation.z = Math.sin(animal.phase * 0.55) * 0.025;

        const glow = 1.1 + Math.sin(animal.phase * 1.6) * 0.55 + (isNight ? 0.8 : 0);
        for (const part of animal.glowParts) {
          part.material.emissiveIntensity = Math.max(0.35, glow);
        }

        if (animal.hostile && playerDistance < HOSTILE_TOUCH_RANGE) {
          const result = context.player.damage(HOSTILE_DAMAGE);
          if (result.applied) {
            context.hud.setStatus(result.died ? "YOU DIED" : "Volcanic creature burned you", 2.4);
            if (result.died) context.hud.showDeathMessage();
          }
        }

        if (animal.direction.lengthSq() > 0) {
          animal.mesh.lookAt(animal.mesh.position.clone().add(animal.direction));
        }
      }
    }
  };
}
