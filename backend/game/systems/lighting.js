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
  const deepNightSky = new THREE.Color(0x020817);
  const deepNightFog = new THREE.Color(0x030713);
  const bloodMoonSky = new THREE.Color(0x3a0508);
  const bloodMoonFog = new THREE.Color(0x210304);
  const daySun = new THREE.Color(0xffffff);
  const sunsetSun = new THREE.Color(0xffb36b);
  const nightSun = new THREE.Color(0x5f7fb8);
  const deepNightSun = new THREE.Color(0x2d416f);
  const bloodMoonLight = new THREE.Color(0xff2d1f);

  return {
    ambient,
    sun,
    updateForDayNight(dayNight) {
      const angle = dayNight.getSunAngle();
      const dayAmount = dayNight.getDayAmount();
      const sunsetAmount = dayNight.getSunsetAmount();
      const nightAmount = 1 - dayAmount;
      const difficulty = dayNight.getNightDifficulty();
      const darknessScale = nightAmount * difficulty.darknessIntensity;
      const nightTint = nightAmount * difficulty.nightTintStrength;
      const shadowScale = nightAmount * difficulty.shadowStrength;
      const bloodMoonTint = nightAmount * difficulty.redTintStrength;

      sun.position.set(
        Math.cos(angle) * 18,
        Math.sin(angle) * 22,
        10
      );

      ambient.intensity = Math.max(0.025, 0.12 + dayAmount * 0.38 + sunsetAmount * 0.08 - darknessScale * 0.16 - shadowScale * 0.08);
      sun.intensity = Math.max(0.018, 0.08 + dayAmount * 0.95 - darknessScale * 0.08 - shadowScale * 0.06);
      sun.color.copy(daySun)
        .lerp(sunsetSun, sunsetAmount)
        .lerp(nightSun, nightAmount * 0.45)
        .lerp(deepNightSun, nightTint * 0.55)
        .lerp(bloodMoonLight, bloodMoonTint * 0.85);
      sun.shadow.radius = 1 + shadowScale * 4;

      const biomeSky = scene.userData.biomeAtmosphere?.background ?? daySky.getHex();
      const biomeFog = scene.userData.biomeAtmosphere?.fog ?? biomeSky;
      const biomeFogDensity = scene.userData.biomeAtmosphere?.density ?? 0.005;
      const biomeDaySky = new THREE.Color(biomeSky);
      const biomeDayFog = new THREE.Color(biomeFog);

      scene.background = biomeDaySky
        .clone()
        .lerp(sunsetSky, sunsetAmount)
        .lerp(nightSky, Math.min(1, nightAmount + darknessScale * 0.35))
        .lerp(deepNightSky, nightTint * 0.6)
        .lerp(bloodMoonSky, bloodMoonTint * 0.8);

      const fogColor = biomeDayFog
        .clone()
        .lerp(nightSky, Math.min(1, nightAmount + difficulty.fogDarkness * nightAmount))
        .lerp(deepNightFog, nightTint * 0.75)
        .lerp(bloodMoonFog, bloodMoonTint * 0.9);
      const fogDensity = biomeFogDensity * (1 + nightAmount * (difficulty.fogDensityMultiplier - 1)) * (1 + bloodMoonTint * 0.25);

      if (!scene.fog?.isFogExp2) {
        scene.fog = new THREE.FogExp2(fogColor, fogDensity);
      } else {
        scene.fog.color.copy(fogColor);
        scene.fog.density = fogDensity;
      }
    }
  };
}
