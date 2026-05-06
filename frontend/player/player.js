import { THREE } from "../rendering/scene.js";

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
  const state = {
    mesh,
    maxHealth: 100,
    health: 100,
    damageCooldown: 0,
    speed: 6,
    damage(amount) {
      if (state.damageCooldown > 0) return false;

      state.health = Math.max(0, state.health - amount);
      state.damageCooldown = 0.8;

      if (state.health <= 0) {
        state.respawn();
      }

      return true;
    },
    respawn() {
      state.health = state.maxHealth;
      mesh.position.set(
        PLAYER_SPAWN.x,
        terrain.getHeight(PLAYER_SPAWN.x, PLAYER_SPAWN.z) + 0.05,
        PLAYER_SPAWN.z
      );
    },
    update(deltaTime, context) {
      state.damageCooldown = Math.max(0, state.damageCooldown - deltaTime);

      const { camera, input } = context;
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
        mesh.position.addScaledVector(moveDirection, state.speed * deltaTime);
        mesh.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
      }

      mesh.position.x = terrain.clamp(mesh.position.x);
      mesh.position.z = terrain.clamp(mesh.position.z);
      mesh.position.y = terrain.getHeight(mesh.position.x, mesh.position.z) + 0.05;

      const cameraTarget = mesh.position.clone().add(new THREE.Vector3(0, 1.15, 0));
      const followPosition = mesh.position.clone()
        .addScaledVector(forward, -5)
        .add(new THREE.Vector3(0, 2.8 + input.pitch, 0));

      camera.position.lerp(followPosition, 0.12);
      camera.lookAt(cameraTarget);
    }
  };

  state.respawn();
  scene.add(mesh);
  return state;
}
