import { THREE } from "../rendering/scene.js";

function createShadowMonster(scene) {
  const monster = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x1b1028,
    emissive: 0x12051f,
    roughness: 0.7
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1, 0.45), material);
  body.position.y = 0.55;
  body.castShadow = true;
  body.receiveShadow = true;
  monster.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), material);
  head.position.y = 1.2;
  head.castShadow = true;
  monster.add(head);

  scene.add(monster);
  return monster;
}

function removeMonster(monster) {
  if (monster.mesh.parent) monster.mesh.parent.remove(monster.mesh);
}

export function createMonsterSystem(scene, terrain) {
  const monsters = [];
  let spawnTimer = 2;

  function spawnMonster(player) {
    let x = 0;
    let z = 0;

    for (let attempts = 0; attempts < 20; attempts++) {
      x = Math.random() * 42 - 21;
      z = Math.random() * 42 - 21;

      if (player.mesh.position.distanceTo(new THREE.Vector3(x, player.mesh.position.y, z)) > 10) {
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
    for (const monster of monsters) removeMonster(monster);
    monsters.length = 0;
  }

  return {
    update(deltaTime, context) {
      if (!context.time.isNight()) {
        clearMonsters();
        spawnTimer = 2;
        return;
      }

      spawnTimer -= deltaTime;
      if (spawnTimer <= 0 && monsters.length < 5) {
        spawnMonster(context.player);
        spawnTimer = 4;
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

        if (distance < 18) {
          toPlayer.y = 0;
          toPlayer.normalize();
          monster.mesh.position.addScaledVector(toPlayer, monster.speed * deltaTime);
          monster.mesh.lookAt(monster.mesh.position.clone().add(toPlayer));
        }

        monster.mesh.position.x = terrain.clamp(monster.mesh.position.x);
        monster.mesh.position.z = terrain.clamp(monster.mesh.position.z);
        monster.mesh.position.y = terrain.getHeight(monster.mesh.position.x, monster.mesh.position.z) + 0.05;

        if (distance < 1.1 && context.player.damage(10)) {
          context.hud?.setStatus("Shadow hit you");
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
