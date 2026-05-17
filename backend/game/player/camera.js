import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function updateFollowCamera(camera, player, input, movementState) {
  const forward = movementState.forward;
  const cameraTarget = player.mesh.position.clone().add(new THREE.Vector3(0, 1.15, 0));
  const followPosition = player.mesh.position.clone()
    .addScaledVector(forward, -5)
    .add(new THREE.Vector3(0, 2.45, 0));

  camera.position.lerp(followPosition, 0.09);
  camera.lookAt(cameraTarget);
}
