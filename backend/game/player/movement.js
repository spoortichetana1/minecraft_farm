import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { clamp } from "../utils/math.js";

const WORLD_FORWARD = new THREE.Vector3(0, 0, 1);
const WORLD_RIGHT = new THREE.Vector3(1, 0, 0);
const MOVEMENT_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"]);

export function createInput(canvas) {
  const input = {
    keys: {},
    yaw: 0,
    pitch: -0.35,
    facingDirection: WORLD_FORWARD.clone(),
    enabled: false,
    sensitivity: 1,
    primaryAction: null,
    doubleAction: null,
    secondaryAction: null,
    clickTimer: null,
    setEnabled(enabled) {
      input.enabled = enabled;
      if (!enabled) input.clearKeys();
    },
    clearKeys() {
      input.keys = {};
    },
    requestPointerLock() {
      return null;
    },
    setSensitivity(value) {
      input.sensitivity = clamp(value, 0.25, 2);
    },
    setPrimaryAction(callback) {
      input.primaryAction = callback;
    },
    setDoubleAction(callback) {
      input.doubleAction = callback;
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
    if (!input.enabled) return;

    if (event.button === 2) input.secondaryAction?.();
  });

  canvas.addEventListener("click", (event) => {
    event.preventDefault();
    if (!input.enabled || event.button !== 0) return;

    if (event.detail >= 2) {
      clearTimeout(input.clickTimer);
      input.clickTimer = null;
      input.doubleAction?.();
      return;
    }

    clearTimeout(input.clickTimer);
    input.clickTimer = setTimeout(() => {
      input.primaryAction?.();
      input.clickTimer = null;
    }, 180);
  });

  document.addEventListener("keydown", (event) => {
    if (!input.enabled) return;
    if (MOVEMENT_KEYS.has(event.code)) event.preventDefault();
    input.keys[event.code] = true;
  });

  document.addEventListener("keyup", (event) => {
    if (!input.enabled) return;
    if (MOVEMENT_KEYS.has(event.code)) event.preventDefault();
    input.keys[event.code] = false;
  });

  return input;
}

export function updatePlayerMovement(player, input, terrain, deltaTime) {
  player.health.update(deltaTime);

  const moveDirection = new THREE.Vector3();
  const forwardInput = Number(Boolean(input.keys.KeyW || input.keys.ArrowUp))
    - Number(Boolean(input.keys.KeyS || input.keys.ArrowDown));
  const sideInput = Number(Boolean(input.keys.KeyA || input.keys.ArrowRight))
    - Number(Boolean(input.keys.KeyD || input.keys.ArrowLeft));

  moveDirection
    .addScaledVector(WORLD_FORWARD, forwardInput)
    .addScaledVector(WORLD_RIGHT, sideInput);

  if (moveDirection.lengthSq() > 0) {
    moveDirection.normalize();
    if (forwardInput !== 0) {
      input.facingDirection.copy(WORLD_FORWARD).multiplyScalar(forwardInput);
      input.yaw = Math.atan2(moveDirection.x, moveDirection.z);
    }
    player.mesh.position.addScaledVector(moveDirection, player.speed * deltaTime);
    player.mesh.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
  }

  player.mesh.position.x = terrain.clamp(player.mesh.position.x);
  player.mesh.position.z = terrain.clamp(player.mesh.position.z);
  player.mesh.position.y = terrain.getHeight(player.mesh.position.x, player.mesh.position.z) + 0.05;

  return {
    forward: input.facingDirection.clone(),
    isMoving: moveDirection.lengthSq() > 0
  };
}
