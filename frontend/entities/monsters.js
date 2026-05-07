import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { randomRange } from "../utils/math.js";

const MAX_MONSTERS = 5;
const SPAWN_INTERVAL_SECONDS = 4;
const SPAWN_DISTANCE_FROM_PLAYER = 10;
const DETECTION_RANGE = 18;
const TOUCH_DAMAGE = 10;
const TOUCH_RANGE = 1.1;

function markShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function createShadowMonster(scene) {
  const monster = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x1b1028,
    emissive: 0x12051f,
    roughness: 0.7
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1, 0.45), material);
  body.position.y = 0.55;
  markShadow(body);
  monster.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), material);
  head.position.y = 1.3;
  markShadow(head);
  monster.add(head);

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

function removeMonster(monster) {
  if (monster.mesh.parent) {
    monster.mesh.parent.remove(monster.mesh);
  }
}

export function createMonsterSystem(scene, terrain) {
  const monsters = [];
  let spawnTimer = 2;

  function spawnMonster(player) {
    let x = 0;
    let z = 0;

    for (let attempts = 0; attempts < 20; attempts++) {
      x = randomRange(-21, 21);
      z = randomRange(-21, 21);

      if (player.mesh.position.distanceTo(new THREE.Vector3(x, player.mesh.position.y, z)) > SPAWN_DISTANCE_FROM_PLAYER) {
        break;
      }
    }

    const mesh = createShadowMonster(scene);
    mesh.position.set(x, terrain.getHeight(x, z) + 0.05, z);
    monsters.push({
      type: "shadow",
      mesh,
      health: 100,
      speed: 2.3
    });
  }

  function clearMonsters() {
    for (const monster of monsters) {
      removeMonster(monster);
    }
    monsters.length = 0;
  }

  return {
    update(deltaTime, context) {
      if (!context.dayNight.isNight) {
        clearMonsters();
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
        const distance = toPlayer.length();

        if (distance < DETECTION_RANGE) {
          toPlayer.y = 0;
          toPlayer.normalize();
          monster.mesh.position.addScaledVector(toPlayer, monster.speed * deltaTime);
          monster.mesh.lookAt(monster.mesh.position.clone().add(toPlayer));
        }

        monster.mesh.position.x = terrain.clamp(monster.mesh.position.x);
        monster.mesh.position.z = terrain.clamp(monster.mesh.position.z);
        monster.mesh.position.y = terrain.getHeight(monster.mesh.position.x, monster.mesh.position.z) + 0.05;

        if (distance < TOUCH_RANGE) {
          const damageResult = context.player.damage(TOUCH_DAMAGE);

          if (damageResult.died) {
            context.hud.setStatus("You Died", 3);
          } else if (damageResult.applied) {
            context.hud.setStatus("Shadow hit you");
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
