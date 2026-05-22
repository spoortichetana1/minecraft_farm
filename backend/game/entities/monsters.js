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
const AXE_ATTACK_RANGE = 2.4;
const AXE_ATTACK_DAMAGE = 50;
const HIT_FLASH_SECONDS = 0.18;
const HIT_PARTICLE_COUNT = 7;
const HIT_PARTICLE_SECONDS = 0.34;
const KNOCKBACK_IMPULSE = 7.5;
const KNOCKBACK_DECAY = 12;

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

function setMonsterFlash(monster, active) {
  monster.mesh.traverse((part) => {
    if (!part.isMesh || !part.material?.emissive) return;

    part.userData.baseEmissive ??= part.material.emissive.getHex();
    part.userData.baseEmissiveIntensity ??= part.material.emissiveIntensity;

    if (active) {
      part.material.emissive.setHex(0xffffff);
      part.material.emissiveIntensity = Math.max(part.userData.baseEmissiveIntensity, 1.8);
      return;
    }

    part.material.emissive.setHex(part.userData.baseEmissive);
    part.material.emissiveIntensity = part.userData.baseEmissiveIntensity;
  });
}

function createHitParticles(scene, position, elite = false) {
  const particles = [];

  for (let index = 0; index < HIT_PARTICLE_COUNT; index++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(randomRange(0.035, 0.075), 6, 4),
      new THREE.MeshStandardMaterial({
        color: elite ? 0xff8a24 : 0xc66cff,
        emissive: elite ? 0xff3d00 : 0x7a1cff,
        emissiveIntensity: 1.7,
        transparent: true,
        opacity: 1,
        roughness: 0.35
      })
    );
    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(1.3, 3.2);
    particle.position.copy(position);
    particle.position.y += randomRange(0.55, 1.35);
    scene.add(particle);
    particles.push({
      mesh: particle,
      velocity: new THREE.Vector3(Math.cos(angle) * speed, randomRange(1.4, 2.8), Math.sin(angle) * speed),
      age: 0,
      lifetime: HIT_PARTICLE_SECONDS
    });
  }

  return particles;
}

function updateHitParticles(particles, deltaTime) {
  for (let index = particles.length - 1; index >= 0; index--) {
    const particle = particles[index];
    particle.age += deltaTime;
    particle.velocity.y -= 5.2 * deltaTime;
    particle.mesh.position.addScaledVector(particle.velocity, deltaTime);
    particle.mesh.material.opacity = Math.max(0, 1 - particle.age / particle.lifetime);

    if (particle.age < particle.lifetime) continue;

    particle.mesh.parent?.remove(particle.mesh);
    particle.mesh.geometry.dispose();
    particle.mesh.material.dispose();
    particles.splice(index, 1);
  }
}

export function createMonsterSystem(scene, terrain) {
  const monsters = [];
  const hitParticles = [];
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
      hitFlashTimer: 0,
      knockbackVelocity: new THREE.Vector3(),
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
      updateHitParticles(hitParticles, deltaTime);

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
        monster.hitFlashTimer = Math.max(0, monster.hitFlashTimer - deltaTime);
        setMonsterFlash(monster, monster.hitFlashTimer > 0);

        if (monster.health <= 0) {
          removeMonster(monster);
          monsters.splice(i, 1);
          continue;
        }

        const toPlayer = context.player.mesh.position.clone().sub(monster.mesh.position);
        let distance = toPlayer.length();
        const playerProtectedNow = context.building?.isPlayerProtected(context.player) ?? false;
        const monsterNearLight = context.building?.isPositionNearLight(monster.mesh.position, LIT_AREA_AVOID_RANGE) ?? false;

        if (monster.knockbackVelocity.lengthSq() > 0.01) {
          monster.mesh.position.addScaledVector(monster.knockbackVelocity, deltaTime);
          const decay = Math.max(0, 1 - KNOCKBACK_DECAY * deltaTime);
          monster.knockbackVelocity.multiplyScalar(decay);
        }

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
    attackNearest(player, hud, damage = AXE_ATTACK_DAMAGE) {
      let nearest = null;
      let nearestDistance = Infinity;
      let nearestIndex = -1;

      for (let index = 0; index < monsters.length; index++) {
        const monster = monsters[index];
        const distance = player.mesh.position.distanceTo(monster.mesh.position);
        if (distance < nearestDistance) {
          nearest = monster;
          nearestDistance = distance;
          nearestIndex = index;
        }
      }

      if (!nearest || nearestDistance > AXE_ATTACK_RANGE) return false;

      nearest.health = Math.max(0, nearest.health - damage);
      nearest.hitFlashTimer = HIT_FLASH_SECONDS;
      const knockbackDirection = nearest.mesh.position.clone().sub(player.mesh.position);
      knockbackDirection.y = 0;
      if (knockbackDirection.lengthSq() < 0.01) {
        knockbackDirection.set(Math.sin(player.mesh.rotation.y), 0, Math.cos(player.mesh.rotation.y));
      }
      knockbackDirection.normalize();
      nearest.knockbackVelocity.copy(knockbackDirection.multiplyScalar(KNOCKBACK_IMPULSE));
      nearest.mesh.position.addScaledVector(nearest.knockbackVelocity, 0.045);
      hitParticles.push(...createHitParticles(scene, nearest.mesh.position, nearest.elite));

      if (nearest.health <= 0) {
        removeMonster(nearest);
        if (nearestIndex >= 0) monsters.splice(nearestIndex, 1);
        hud.setStatus(nearest.elite ? "Elite shadow defeated" : "Shadow defeated");
        return true;
      }

      setMonsterFlash(nearest, true);
      hud.setStatus(nearest.elite ? "Hit elite shadow" : "Hit shadow");
      return true;
    }
  };
}
