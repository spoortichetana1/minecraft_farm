import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export function createLighting(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(10, 20, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  scene.add(sun);

  const daySky = new THREE.Color(0x87ceeb);
  const sunsetSky = new THREE.Color(0xf08a4b);
  const nightSky = new THREE.Color(0x081a35);
  const daySun = new THREE.Color(0xffffff);
  const sunsetSun = new THREE.Color(0xffb36b);
  const nightSun = new THREE.Color(0x5f7fb8);

  return {
    ambient,
    sun,
    updateForDayNight(dayNight) {
      const angle = dayNight.getSunAngle();
      const dayAmount = dayNight.getDayAmount();
      const sunsetAmount = dayNight.getSunsetAmount();
      const nightAmount = 1 - dayAmount;

      sun.position.set(
        Math.cos(angle) * 18,
        Math.sin(angle) * 22,
        10
      );

      ambient.intensity = 0.12 + dayAmount * 0.38 + sunsetAmount * 0.08;
      sun.intensity = 0.08 + dayAmount * 0.95;
      sun.color.copy(daySun).lerp(sunsetSun, sunsetAmount).lerp(nightSun, nightAmount * 0.45);

      const biomeSky = scene.userData.biomeAtmosphere?.background ?? daySky.getHex();
      const biomeDaySky = new THREE.Color(biomeSky);

      scene.background = biomeDaySky
        .clone()
        .lerp(sunsetSky, sunsetAmount)
        .lerp(nightSky, nightAmount);
    }
  };
}
