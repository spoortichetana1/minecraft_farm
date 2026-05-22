import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { createHealth } from "../systems/health.js";
import { createHunger, FOOD_VALUES } from "../systems/hunger.js";
import { AXE_TOOL_TYPE } from "./tools.js";

const PLAYER_SPAWN = new THREE.Vector3(0, 0, 7);
const AXE_SWING_DURATION = 0.34;
const AXE_ATTACK_COOLDOWN = 0.46;
const STARVATION_DAMAGE = 4;

function addShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function createAxeModel(materials) {
  const axe = new THREE.Group();

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.78, 8),
    materials.wood
  );
  handle.position.y = -0.12;
  axe.add(handle);

  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.047, 0.05, 0.2, 8),
    materials.grip
  );
  grip.position.y = -0.44;
  axe.add(grip);

  const pommel = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.055, 0.09),
    materials.darkMetal
  );
  pommel.position.y = -0.56;
  axe.add(pommel);

  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.1, 0.1),
    materials.darkMetal
  );
  collar.position.y = 0.28;
  axe.add(collar);

  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.03, 0.12);
  bladeShape.lineTo(0.2, 0.18);
  bladeShape.lineTo(0.34, 0.05);
  bladeShape.lineTo(0.29, -0.13);
  bladeShape.lineTo(0.05, -0.16);
  bladeShape.lineTo(-0.06, -0.03);
  bladeShape.lineTo(-0.03, 0.12);

  const blade = new THREE.Mesh(
    new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.075,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012
    }),
    materials.metal
  );
  blade.position.set(0.02, 0.3, -0.038);
  axe.add(blade);

  const cuttingEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, 0.25, 0.085),
    materials.edge
  );
  cuttingEdge.position.set(0.31, 0.28, 0);
  cuttingEdge.rotation.z = -0.08;
  axe.add(cuttingEdge);

  axe.position.set(0.02, -0.44, 0.1);
  axe.rotation.set(0.3, -0.1, 0.34);
  axe.visible = false;
  return axe;
}

function createStickmanMesh() {
  const player = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2f6fed, roughness: 0.75 });
  const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd2a6, roughness: 0.75 });
  const axeMaterials = {
    wood: new THREE.MeshStandardMaterial({ color: 0x8a5528, roughness: 0.82 }),
    grip: new THREE.MeshStandardMaterial({ color: 0x3a2417, roughness: 0.9 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x4d5963, metalness: 0.45, roughness: 0.38 }),
    metal: new THREE.MeshStandardMaterial({ color: 0xaebdca, metalness: 0.55, roughness: 0.28 }),
    edge: new THREE.MeshStandardMaterial({ color: 0xe5eef5, metalness: 0.6, roughness: 0.2 })
  };

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

  const axe = createAxeModel(axeMaterials);
  rightArm.add(axe);
  player.userData.toolModels = { [AXE_TOOL_TYPE]: axe };

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
  const hunger = createHunger(100);
  const axe = mesh.userData.toolModels?.[AXE_TOOL_TYPE];
  const axeRestRotation = {
    x: axe?.rotation.x ?? 0,
    y: axe?.rotation.y ?? 0,
    z: axe?.rotation.z ?? 0
  };
  let equippedTool = null;
  let axeSwingTime = 0;
  let axeCooldownTime = 0;

  function respawn() {
    health.reset();
    hunger.reset();
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
    hunger,
    speed: 6,
    respawn,
    equipTool(type) {
      equippedTool = type;
      if (axe) axe.visible = type === AXE_TOOL_TYPE;
    },
    swingTool(type = equippedTool) {
      if (type !== AXE_TOOL_TYPE || equippedTool !== AXE_TOOL_TYPE) return false;
      if (axeCooldownTime > 0) return false;

      axeSwingTime = AXE_SWING_DURATION;
      axeCooldownTime = AXE_ATTACK_COOLDOWN;
      return true;
    },
    update(deltaTime) {
      hunger.update(deltaTime);
      if (hunger.currentHunger <= 0 && health.damage(STARVATION_DAMAGE) && health.currentHealth <= 0) {
        respawn();
      }

      if (!axe) return;

      const swingProgress = 1 - axeSwingTime / AXE_SWING_DURATION;
      const swingArc = axeSwingTime > 0 ? Math.sin(Math.min(1, swingProgress) * Math.PI) : 0;
      axe.rotation.x = axeRestRotation.x - swingArc * 1.35;
      axe.rotation.y = axeRestRotation.y;
      axe.rotation.z = axeRestRotation.z + swingArc * 0.45;
      axeSwingTime = Math.max(0, axeSwingTime - deltaTime);
      axeCooldownTime = Math.max(0, axeCooldownTime - deltaTime);
    },
    eatFood(type, inventory) {
      const hungerValue = FOOD_VALUES[type];
      if (!hungerValue) {
        return { eaten: false, reason: "not-food" };
      }

      if (hunger.currentHunger >= hunger.maxValue) {
        return { eaten: false, reason: "full" };
      }

      if (!inventory.removeItem(type, 1)) {
        return { eaten: false, reason: "missing" };
      }

      hunger.restore(hungerValue);
      return {
        eaten: true,
        restored: hungerValue,
        type
      };
    },
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
