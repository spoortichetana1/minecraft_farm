import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { randomChoice, randomRange } from "../utils/math.js";

function createAnimal(scene, color) {
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

function pickDirection() {
  const angle = Math.random() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
}

export function createAnimals(scene, terrain, count) {
  const colors = [0xffffff, 0x8b5a2b, 0xd9c2a3, 0x222222];
  const animals = [];

  for (let i = 0; i < count; i++) {
    const x = randomRange(-18, 18);
    const z = randomRange(-18, 18);
    const mesh = createAnimal(scene, randomChoice(colors));

    mesh.position.set(x, terrain.getHeight(x, z) + 0.25, z);
    animals.push({
      mesh,
      direction: pickDirection(),
      speed: 0.9 + Math.random() * 0.5,
      directionTimer: 2 + Math.random() * 3
    });
  }

  return {
    update(deltaTime, context) {
      for (const animal of animals) {
        animal.directionTimer -= deltaTime;

        if (animal.directionTimer <= 0) {
          animal.direction = pickDirection();
          animal.directionTimer = 2 + Math.random() * 3;
        }

        animal.mesh.position.addScaledVector(animal.direction, animal.speed * deltaTime);
        animal.mesh.position.x = terrain.clamp(animal.mesh.position.x);
        animal.mesh.position.z = terrain.clamp(animal.mesh.position.z);
        animal.mesh.position.y = context.terrain.getHeight(animal.mesh.position.x, animal.mesh.position.z) + 0.25;
        animal.mesh.lookAt(animal.mesh.position.clone().add(animal.direction));
      }
    }
  };
}
