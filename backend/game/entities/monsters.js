import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { randomRange } from "../utils/math.js";

const MAX_MONSTERS = 10;
const SPAWN_INTERVAL_SECONDS = 3.5;
const MIN_SPAWN_DISTANCE_FROM_PLAYER = 24;
const MAX_SPAWN_DISTANCE_FROM_PLAYER = 38;
const DETECTION_RANGE = 20;
const TOUCH_DAMAGE = 12;
const TOUCH_RANGE = 1.1;
const WANDER_SPEED = 0.9;
const CHASE_SPEED = 2.7;
const SHELTER_AVOID_RANGE = 12;

function markShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function createShadowMonster(scene) {
  const monster = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x08050d,
    emissive: 0x15051f,
    roughness: 0.7
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff1f1f,
    emissive: 0xff0000,
    emissiveIntensity: 2,
    roughness: 0.35
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1, 0.45), material);
  body.position.y = 0.55;
  markShadow(body);
  monster.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), material);
  head.position.y = 1.3;
  markShadow(head);
  monster.add(head);

  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.03), eyeMaterial);
  leftEye.position.set(-0.09, 1.34, 0.225);
  monster.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.03), eyeMaterial);
  rightEye.position.set(0.09, 1.34, 0.225);
  monster.add(rightEye);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.75, 0.16), material);
  leftArm.position.set(-0.52, 0.58, 0);
  leftArm.rotation.z = 0.18;
  markShadow(leftArm);
  monster.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.75, 0.16), material);
  rightArm.position.set(0.52, 0.58, 0);
  rightArm.rotation.z = -0.18;
  markShadow(rightArm);
  monster.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), material);
  leftLeg.position.set(-0.22, -0.25, 0);
  markShadow(leftLeg);
  monster.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), material);
  rightLeg.position.set(0.22, -0.25, 0);
  markShadow(rightLeg);
  monster.add(rightLeg);

  scene.add(monster);
  return monster;
}

function pickWanderDirection() {
  const angle = Math.random() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
}

function removeMonster(monster) {
  if (monster.mesh.parent) {
    monster.mesh.parent.remove(monster.mesh);
  }
}

export function createMonsterSystem(scene, terrain) {
  const monsters = [];
  let spawnTimer = 2;

  function spawnMonster(player) {
    const angle = Math.random() * Math.PI * 2;
    const distance = randomRange(MIN_SPAWN_DISTANCE_FROM_PLAYER, MAX_SPAWN_DISTANCE_FROM_PLAYER);
    const x = player.mesh.position.x + Math.cos(angle) * distance;
    const z = player.mesh.position.z + Math.sin(angle) * distance;

    const mesh = createShadowMonster(scene);
    mesh.position.set(x, terrain.getHeight(x, z) + 0.05, z);
    monsters.push({
      type: "shadow",
      mesh,
      health: 100,
      speed: CHASE_SPEED,
      wanderDirection: pickWanderDirection(),
      wanderTimer: randomRange(1.5, 4)
    });

    console.log("Shadow monster spawned in the night.");
  }

  function clearMonsters(reason = "cleared") {
    for (const monster of monsters) {
      removeMonster(monster);
    }
    if (monsters.length > 0) {
      console.log(`Shadow monsters ${reason}.`);
    }
    monsters.length = 0;
  }

  return {
    update(deltaTime, context) {
      if (!context.dayNight.isNight) {
        clearMonsters("burned in daylight");
        spawnTimer = 2;
        return;
      }

      spawnTimer -= deltaTime;
      if (spawnTimer <= 0 && monsters.length < MAX_MONSTERS) {
        spawnMonster(context.player);
        spawnTimer = SPAWN_INTERVAL_SECONDS;
      }

      for (let i = monsters.length - 1; i >= 0; i--) {
        const monster = monsters[i];

        if (monster.health <= 0) {
          removeMonster(monster);
          monsters.splice(i, 1);
          continue;
        }

        const toPlayer = context.player.mesh.position.clone().sub(monster.mesh.position);
        let distance = toPlayer.length();
        const playerSheltered = context.building?.isPlayerSheltered(context.player) ?? false;

        if (playerSheltered && distance < SHELTER_AVOID_RANGE) {
          const awayFromShelter = monster.mesh.position.clone().sub(context.player.mesh.position);
          awayFromShelter.y = 0;
          awayFromShelter.normalize();
          monster.mesh.position.addScaledVector(awayFromShelter, WANDER_SPEED * 1.4 * deltaTime);
          monster.mesh.lookAt(monster.mesh.position.clone().add(awayFromShelter));
        } else if (distance < DETECTION_RANGE) {
          toPlayer.y = 0;
          toPlayer.normalize();
          monster.mesh.position.addScaledVector(toPlayer, monster.speed * deltaTime);
          monster.mesh.lookAt(monster.mesh.position.clone().add(toPlayer));
        } else {
          monster.wanderTimer -= deltaTime;

          if (monster.wanderTimer <= 0) {
            monster.wanderDirection = pickWanderDirection();
            monster.wanderTimer = randomRange(1.5, 4);
          }

          monster.mesh.position.addScaledVector(monster.wanderDirection, WANDER_SPEED * deltaTime);
          monster.mesh.lookAt(monster.mesh.position.clone().add(monster.wanderDirection));
        }

        monster.mesh.position.x = terrain.clamp(monster.mesh.position.x);
        monster.mesh.position.z = terrain.clamp(monster.mesh.position.z);
        monster.mesh.position.y = terrain.getHeight(monster.mesh.position.x, monster.mesh.position.z) + 0.05;
        distance = context.player.mesh.position.distanceTo(monster.mesh.position);

        if (!playerSheltered && distance < TOUCH_RANGE) {
          const damageResult = context.player.damage(TOUCH_DAMAGE);

          if (damageResult.died) {
            context.hud.showDeathMessage();
          } else if (damageResult.applied) {
            context.hud.setStatus("Shadow hit you");
            console.log("Shadow monster hit the player.");
          }
        }
      }
    },
    attackNearest(player, hud) {
      let nearest = null;
      let nearestDistance = Infinity;

      for (const monster of monsters) {
        const distance = player.mesh.position.distanceTo(monster.mesh.position);
        if (distance < nearestDistance) {
          nearest = monster;
          nearestDistance = distance;
        }
      }

      if (!nearest || nearestDistance > 2.4) return false;

      nearest.health -= 50;
      hud.setStatus(nearest.health <= 0 ? "Shadow defeated" : "Hit shadow");
      return true;
    }
  };
}
