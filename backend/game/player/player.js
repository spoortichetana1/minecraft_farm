import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createHealth } from "../systems/health.js";

const PLAYER_SPAWN = new THREE.Vector3(0, 0, 7);

function addShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function createStickmanMesh() {
  const player = new THREE.Group();
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
    if (part.isMesh) addShadow(part);
  });

  return player;
}

export function createPlayer(scene, terrain) {
  const mesh = createStickmanMesh();
  const health = createHealth(100);

  function respawn() {
    health.reset();
    mesh.position.set(
      PLAYER_SPAWN.x,
      terrain.getHeight(PLAYER_SPAWN.x, PLAYER_SPAWN.z) + 0.05,
      PLAYER_SPAWN.z
    );
  }

  respawn();
  scene.add(mesh);

  return {
    mesh,
    health,
    speed: 6,
    respawn,
    damage(amount) {
      const applied = health.damage(amount);
      const died = applied && health.currentHealth <= 0;

      if (died) {
        respawn();
      }

      return {
        applied,
        died
      };
    }
  };
}
