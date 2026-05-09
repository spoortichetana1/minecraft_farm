import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const CROP_STAGES = [
  { name: "seed", height: 0.12, color: 0xd6b44c },
  { name: "sprout", height: 0.28, color: 0x6fca3f },
  { name: "medium", height: 0.48, color: 0x4fa52f },
  { name: "mature", height: 0.72, color: 0xe2c044 }
];

const GROWTH_SECONDS_PER_STAGE = 7;
const INTERACTION_RANGE = 5;
const SEED_DROP_CHANCE = 0.45;

function keyForCell(x, z) {
  return `${x},${z}`;
}

function createCropMesh(stage) {
  const stageDef = CROP_STAGES[stage];
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, stageDef.height, 0.28),
    new THREE.MeshStandardMaterial({ color: stageDef.color, roughness: 0.8 })
  );

  mesh.castShadow = true;
  return mesh;
}

function updateCropMesh(crop, terrain) {
  if (crop.mesh) {
    crop.mesh.parent.remove(crop.mesh);
  }

  crop.mesh = createCropMesh(crop.stage);
  crop.mesh.position.set(
    crop.x,
    terrain.getHeight(crop.x, crop.z) + 0.18 + CROP_STAGES[crop.stage].height / 2,
    crop.z
  );
  crop.mesh.userData.crop = crop;
  crop.scene.add(crop.mesh);
}

function createFarmland(scene, terrain, x, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.12, 0.92),
    new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.95 })
  );

  mesh.position.set(x, terrain.getHeight(x, z) + 0.06, z);
  mesh.receiveShadow = true;
  scene.add(mesh);

  return {
    x,
    z,
    mesh,
    ownsMesh: true,
    crop: null
  };
}

export function createFarmingSystem(scene, terrain) {
  const raycaster = new THREE.Raycaster();
  const screenCenter = new THREE.Vector2(0, 0);
  const farmland = new Map();

  for (let x = -2; x <= 2; x++) {
    for (let z = 2; z <= 4; z++) {
      const plot = createFarmland(scene, terrain, x, z);
      farmland.set(keyForCell(x, z), plot);
    }
  }

  function addFarmlandPlot(x, z, mesh = null) {
    const key = keyForCell(x, z);
    if (farmland.has(key)) return farmland.get(key);

    const plot = mesh
      ? {
          x,
          z,
          mesh,
          ownsMesh: false,
          crop: null
        }
      : createFarmland(scene, terrain, x, z);

    farmland.set(key, plot);
    return plot;
  }

  function setCropOnPlot(plot, cropState) {
    if (plot.crop?.mesh?.parent) {
      plot.crop.mesh.parent.remove(plot.crop.mesh);
    }

    const stage = Math.max(0, Math.min(CROP_STAGES.length - 1, Math.round(Number(cropState.stage ?? 0))));
    const growthTimer = Math.max(0, Number(cropState.growthTimer ?? 0));

    plot.crop = {
      scene,
      plot,
      x: plot.x,
      z: plot.z,
      stage,
      growthTimer,
      mesh: null
    };
    updateCropMesh(plot.crop, terrain);
  }

  function removeFarmlandPlot(x, z, options = {}) {
    const plot = farmland.get(keyForCell(x, z));
    if (!plot) return false;

    if (plot.crop?.mesh?.parent) {
      plot.crop.mesh.parent.remove(plot.crop.mesh);
    }

    if (!options.keepMesh && plot.ownsMesh && plot.mesh.parent) {
      plot.mesh.parent.remove(plot.mesh);
    }

    farmland.delete(keyForCell(x, z));
    return true;
  }

  function getFarmlandMeshes() {
    return [...farmland.values()].map((plot) => plot.mesh);
  }

  function getCropMeshes() {
    return [...farmland.values()]
      .filter((plot) => plot.crop?.mesh)
      .map((plot) => plot.crop.mesh);
  }

  function getClickedPlot(camera) {
    raycaster.setFromCamera(screenCenter, camera);
    const hits = raycaster.intersectObjects([...getCropMeshes(), ...getFarmlandMeshes()], false);
    const hit = hits.find((result) => result.distance <= INTERACTION_RANGE);

    if (!hit) return null;
    if (hit.object.userData.crop) {
      return hit.object.userData.crop.plot;
    }

    return [...farmland.values()].find((plot) => plot.mesh === hit.object) ?? null;
  }

  function tryGatherSeeds(camera, inventory, hud) {
    const terrainMeshes = terrain.getMeshes ? terrain.getMeshes() : [terrain.mesh];

    raycaster.setFromCamera(screenCenter, camera);
    const hits = raycaster.intersectObjects(terrainMeshes, false);
    const hit = hits.find((result) => result.distance <= INTERACTION_RANGE);

    if (!hit) return false;

    if (Math.random() <= SEED_DROP_CHANCE) {
      inventory.addItem("seeds", 1);
      hud.setStatus("+1 seeds");
    } else {
      hud.setStatus("No seeds found");
    }

    return true;
  }

  return {
    addFarmlandPlot,
    removeFarmlandPlot,
    update(deltaTime) {
      for (const plot of farmland.values()) {
        if (!plot.crop || plot.crop.stage >= CROP_STAGES.length - 1) continue;

        plot.crop.growthTimer += deltaTime;
        if (plot.crop.growthTimer < GROWTH_SECONDS_PER_STAGE) continue;

        plot.crop.growthTimer = 0;
        plot.crop.stage++;
        updateCropMesh(plot.crop, terrain);
      }
    },
    interact(camera, inventory, hud) {
      const plot = getClickedPlot(camera);

      if (!plot) {
        return tryGatherSeeds(camera, inventory, hud);
      }

      if (!plot.crop) {
        if (!inventory.removeItem("seeds", 1)) {
          hud.setStatus("Need seeds");
          return true;
        }

        plot.crop = {
          scene,
          plot,
          x: plot.x,
          z: plot.z,
          stage: 0,
          growthTimer: 0,
          mesh: null
        };
        updateCropMesh(plot.crop, terrain);
        hud.setStatus("Seed planted");
        return true;
      }

      if (plot.crop.stage < CROP_STAGES.length - 1) {
        hud.setStatus(`Crop stage: ${CROP_STAGES[plot.crop.stage].name}`);
        return true;
      }

      plot.crop.mesh.parent.remove(plot.crop.mesh);
      plot.crop = null;
      inventory.addItem("wheat", 1);
      hud.setStatus("+1 wheat");
      return true;
    },
    getState() {
      return [...farmland.values()]
        .filter((plot) => plot.crop)
        .map((plot) => ({
          x: plot.x,
          z: plot.z,
          stage: plot.crop.stage,
          growthTimer: plot.crop.growthTimer
        }));
    },
    loadState(savedCrops = []) {
      for (const plot of farmland.values()) {
        if (plot.crop?.mesh?.parent) {
          plot.crop.mesh.parent.remove(plot.crop.mesh);
        }
        plot.crop = null;
      }

      for (const cropState of savedCrops) {
        const x = Math.round(Number(cropState.x));
        const z = Math.round(Number(cropState.z));

        if (!Number.isFinite(x) || !Number.isFinite(z)) continue;

        const plot = farmland.get(keyForCell(x, z));
        if (!plot) continue;

        setCropOnPlot(plot, cropState);
      }
    }
  };
}
