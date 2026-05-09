import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { clamp } from "../utils/math.js";

export function createInput(canvas) {
  const input = {
    keys: {},
    yaw: 0,
    pitch: -0.35,
    primaryAction: null,
    secondaryAction: null,
    setPrimaryAction(callback) {
      input.primaryAction = callback;
    },
    setSecondaryAction(callback) {
      input.secondaryAction = callback;
    },
    getCameraDirection() {
      return new THREE.Vector3(
        Math.sin(input.yaw) * Math.cos(input.pitch),
        Math.sin(input.pitch),
        Math.cos(input.yaw) * Math.cos(input.pitch)
      ).normalize();
    }
  };

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    canvas.requestPointerLock();
    if (event.button === 0) input.primaryAction?.();
    if (event.button === 2) input.secondaryAction?.();
  });

  document.addEventListener("keydown", (event) => {
    input.keys[event.code] = true;
  });

  document.addEventListener("keyup", (event) => {
    input.keys[event.code] = false;
  });

  document.addEventListener("mousemove", (event) => {
    if (document.pointerLockElement !== canvas) return;

    input.yaw -= event.movementX * 0.002;
    input.pitch -= event.movementY * 0.002;
    input.pitch = clamp(input.pitch, -1.2, 0.8);
  });

  return input;
}

export function updatePlayerMovement(player, input, terrain, deltaTime) {
  player.health.update(deltaTime);

  const direction = input.getCameraDirection();
  const forward = new THREE.Vector3(direction.x, 0, direction.z).normalize();
  const left = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const moveDirection = new THREE.Vector3();

  if (input.keys.KeyW) moveDirection.add(forward);
  if (input.keys.KeyS) moveDirection.addScaledVector(forward, -1);
  if (input.keys.KeyA) moveDirection.add(left);
  if (input.keys.KeyD) moveDirection.addScaledVector(left, -1);

  if (moveDirection.lengthSq() > 0) {
    moveDirection.normalize();
    player.mesh.position.addScaledVector(moveDirection, player.speed * deltaTime);
    player.mesh.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
  }

  player.mesh.position.x = terrain.clamp(player.mesh.position.x);
  player.mesh.position.z = terrain.clamp(player.mesh.position.z);
  player.mesh.position.y = terrain.getHeight(player.mesh.position.x, player.mesh.position.z) + 0.05;

  return {
    forward,
    isMoving: moveDirection.lengthSq() > 0
  };
}
