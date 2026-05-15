import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { randomRange } from "../utils/math.js";

const MIN_SPAWN_DISTANCE_FROM_PLAYER = 24;
const MAX_SPAWN_DISTANCE_FROM_PLAYER = 38;
const TOUCH_RANGE = 1.1;
const WANDER_SPEED = 0.9;
const CHASE_SPEED = 2.7;
const SHELTER_AVOID_RANGE = 12;
const LIT_AREA_AVOID_RANGE = 9;
const SPAWN_ATTEMPTS = 8;

function markShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

function createShadowMonster(scene, elite = false) {
  const monster = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: elite ? 0x120018 : 0x08050d,
    emissive: elite ? 0x4d003f : 0x15051f,
    emissiveIntensity: elite ? 0.65 : 0.25,
    roughness: 0.7
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: elite ? 0xff6f00 : 0xff1f1f,
    emissive: elite ? 0xff3d00 : 0xff0000,
    emissiveIntensity: elite ? 3 : 2,
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

  if (elite) {
    monster.scale.setScalar(1.18);
  }

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

  function getSpawnPosition(player, building) {
    let fallback = null;

    for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = randomRange(MIN_SPAWN_DISTANCE_FROM_PLAYER, MAX_SPAWN_DISTANCE_FROM_PLAYER);
      const x = player.mesh.position.x + Math.cos(angle) * distance;
      const z = player.mesh.position.z + Math.sin(angle) * distance;
      const position = new THREE.Vector3(x, terrain.getHeight(x, z) + 0.05, z);

      fallback ??= position;

      const protection = building?.getShelterProtectionAt(position);
      const nearLight = building?.isPositionNearLight(position, LIT_AREA_AVOID_RANGE) ?? false;
      if (!nearLight && !protection?.sheltered) {
        return position;
      }
    }

    return fallback;
  }

  function spawnMonster(player, difficulty, building) {
    const position = getSpawnPosition(player, building);
    if (!position) return false;

    const elite = Math.random() < difficulty.eliteChance;
    const mesh = createShadowMonster(scene, elite);
    const healthMultiplier = elite ? difficulty.eliteHealthMultiplier : 1;
    const speedMultiplier = elite ? difficulty.eliteSpeedMultiplier : 1;
    const damageMultiplier = elite ? difficulty.eliteDamageMultiplier : 1;

    mesh.position.copy(position);
    monsters.push({
      type: elite ? "elite-shadow" : "shadow",
      elite,
      mesh,
      health: difficulty.monsterHealth * healthMultiplier,
      speed: CHASE_SPEED * difficulty.monsterSpeedMultiplier * speedMultiplier,
      attackDamage: difficulty.attackDamage * damageMultiplier,
      attackCooldownSeconds: difficulty.attackCooldownSeconds,
      attackTimer: randomRange(0, difficulty.attackCooldownSeconds),
      wanderDirection: pickWanderDirection(),
      wanderTimer: randomRange(1.5, 4)
    });

    console.log(`${elite ? "Elite shadow" : "Shadow monster"} spawned on night ${difficulty.night}.`);
    return true;
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
      const difficulty = context.dayNight.getNightDifficulty();

      if (!context.dayNight.isNight) {
        clearMonsters("burned in daylight");
        context.player.health.invincibilitySeconds = 1.2;
        spawnTimer = 2;
        return;
      }

      context.player.health.invincibilitySeconds = difficulty.playerInvincibilitySeconds;
      spawnTimer -= deltaTime;
      const maxMonsters = Math.max(1, difficulty.monsterCount);
      const playerProtected = context.building?.isPlayerProtected(context.player) ?? false;
      const spawnProtectionMultiplier = playerProtected ? 0.45 : 1;
      const activeMaxMonsters = Math.max(1, Math.ceil(maxMonsters * spawnProtectionMultiplier));
      if (spawnTimer <= 0 && monsters.length < activeMaxMonsters) {
        const spawnCount = Math.min(difficulty.spawnBurstCount, activeMaxMonsters - monsters.length);
        for (let count = 0; count < spawnCount; count++) {
          spawnMonster(context.player, difficulty, context.building);
        }
        spawnTimer = difficulty.spawnIntervalSeconds / spawnProtectionMultiplier;
      }

      for (let i = monsters.length - 1; i >= 0; i--) {
        const monster = monsters[i];
        monster.attackTimer = Math.max(0, monster.attackTimer - deltaTime);

        if (monster.health <= 0) {
          removeMonster(monster);
          monsters.splice(i, 1);
          continue;
        }

        const toPlayer = context.player.mesh.position.clone().sub(monster.mesh.position);
        let distance = toPlayer.length();
        const playerProtectedNow = context.building?.isPlayerProtected(context.player) ?? false;
        const monsterNearLight = context.building?.isPositionNearLight(monster.mesh.position, LIT_AREA_AVOID_RANGE) ?? false;

        if ((playerProtectedNow && distance < SHELTER_AVOID_RANGE) || monsterNearLight) {
          const awayFromShelter = monster.mesh.position.clone().sub(context.player.mesh.position);
          if (awayFromShelter.lengthSq() < 0.01) {
            awayFromShelter.copy(monster.wanderDirection);
          }
          awayFromShelter.y = 0;
          awayFromShelter.normalize();
          monster.mesh.position.addScaledVector(awayFromShelter, WANDER_SPEED * 1.8 * deltaTime);
          monster.mesh.lookAt(monster.mesh.position.clone().add(awayFromShelter));
        } else if (distance < difficulty.aggressionRange * (playerProtectedNow ? 0.35 : 1)) {
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

        if (!playerProtectedNow && distance < TOUCH_RANGE && monster.attackTimer <= 0) {
          const damageResult = context.player.damage(monster.attackDamage);
          monster.attackTimer = monster.attackCooldownSeconds;

          if (damageResult.died) {
            context.hud.showDeathMessage();
          } else if (damageResult.applied) {
            context.hud.setStatus(monster.elite ? "Elite shadow hit you" : "Shadow hit you");
            console.log(`${monster.elite ? "Elite shadow" : "Shadow monster"} hit the player.`);
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
