import { THREE } from "../rendering/scene.js";

export function createInput(canvas) {
  const input = {
    keys: {},
    yaw: 0,
    pitch: -0.35,
    primaryAction: null,
    setPrimaryAction(callback) {
      input.primaryAction = callback;
    },
    getCameraDirection() {
      return new THREE.Vector3(
        Math.sin(input.yaw) * Math.cos(input.pitch),
        Math.sin(input.pitch),
        Math.cos(input.yaw) * Math.cos(input.pitch)
      ).normalize();
    }
  };

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
    input.primaryAction?.();
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
    input.pitch = Math.max(-1.2, Math.min(0.8, input.pitch));
  });

  return input;
}
