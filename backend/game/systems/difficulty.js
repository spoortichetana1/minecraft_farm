function applyBloodMoon(baseDifficulty) {
  if (baseDifficulty.night % 7 !== 0) {
    return {
      ...baseDifficulty,
      bloodMoon: false,
      redTintStrength: 0,
      spawnBurstCount: 1
    };
  }

  return {
    ...baseDifficulty,
    bloodMoon: true,
    monsterCount: Math.ceil(baseDifficulty.monsterCount * 1.65),
    monsterSpeedMultiplier: baseDifficulty.monsterSpeedMultiplier * 1.12,
    monsterHealth: Math.ceil(baseDifficulty.monsterHealth * 1.28),
    spawnIntervalSeconds: Math.max(0.75, baseDifficulty.spawnIntervalSeconds * 0.55),
    aggressionRange: baseDifficulty.aggressionRange + 10,
    attackDamage: Math.ceil(baseDifficulty.attackDamage * 1.2),
    attackCooldownSeconds: Math.max(0.55, baseDifficulty.attackCooldownSeconds * 0.82),
    playerInvincibilitySeconds: Math.max(0.65, baseDifficulty.playerInvincibilitySeconds * 0.9),
    eliteChance: Math.min(0.6, baseDifficulty.eliteChance + 0.12),
    darknessIntensity: Math.min(0.9, baseDifficulty.darknessIntensity + 0.18),
    fogDensityMultiplier: baseDifficulty.fogDensityMultiplier * 1.35,
    fogDarkness: Math.min(0.95, baseDifficulty.fogDarkness + 0.2),
    nightTintStrength: Math.min(0.95, baseDifficulty.nightTintStrength + 0.2),
    shadowStrength: Math.min(0.95, baseDifficulty.shadowStrength + 0.18),
    redTintStrength: 0.72,
    spawnBurstCount: 2
  };
}

export function getNightDifficulty(night) {
  const currentNight = Math.max(1, Math.floor(Number(night) || 1));
  const cappedNight = Math.min(currentNight, 20);
  const lateNight = Math.max(0, currentNight - 10);

  if (currentNight <= 2) {
    const step = currentNight - 1;

    return applyBloodMoon({
      night: currentNight,
      tier: "early",
      monsterCount: 3 + step,
      monsterSpeedMultiplier: 0.72 + step * 0.08,
      monsterHealth: 55 + step * 15,
      spawnIntervalSeconds: 5.2 - step * 0.4,
      aggressionRange: 14 + step * 2,
      attackDamage: 8 + step * 2,
      attackCooldownSeconds: 1.6 - step * 0.15,
      playerInvincibilitySeconds: 1.3,
      eliteChance: 0,
      eliteHealthMultiplier: 1,
      eliteSpeedMultiplier: 1,
      eliteDamageMultiplier: 1,
      darknessIntensity: step * 0.03,
      fogDensityMultiplier: 1 + step * 0.08,
      fogDarkness: step * 0.04,
      nightTintStrength: step * 0.05,
      shadowStrength: step * 0.04
    });
  }

  if (currentNight <= 5) {
    const step = currentNight - 3;

    return applyBloodMoon({
      night: currentNight,
      tier: "rising",
      monsterCount: 6 + step * 2,
      monsterSpeedMultiplier: 0.92 + step * 0.08,
      monsterHealth: 85 + step * 18,
      spawnIntervalSeconds: 4 - step * 0.35,
      aggressionRange: 20 + step * 3,
      attackDamage: 11 + step * 2,
      attackCooldownSeconds: 1.35 - step * 0.1,
      playerInvincibilitySeconds: 1.15,
      eliteChance: 0,
      eliteHealthMultiplier: 1,
      eliteSpeedMultiplier: 1,
      eliteDamageMultiplier: 1,
      darknessIntensity: 0.08 + step * 0.04,
      fogDensityMultiplier: 1.18 + step * 0.16,
      fogDarkness: 0.12 + step * 0.07,
      nightTintStrength: 0.16 + step * 0.08,
      shadowStrength: 0.14 + step * 0.07
    });
  }

  if (currentNight < 10) {
    const step = currentNight - 6;

    return applyBloodMoon({
      night: currentNight,
      tier: "horde",
      monsterCount: 11 + step * 2,
      monsterSpeedMultiplier: 1.14 + step * 0.07,
      monsterHealth: 135 + step * 22,
      spawnIntervalSeconds: 2.8 - step * 0.25,
      aggressionRange: 28 + step * 2,
      attackDamage: 15 + step * 2,
      attackCooldownSeconds: 1.05 - step * 0.07,
      playerInvincibilitySeconds: 1,
      eliteChance: 0,
      eliteHealthMultiplier: 1,
      eliteSpeedMultiplier: 1,
      eliteDamageMultiplier: 1,
      darknessIntensity: 0.2 + step * 0.055,
      fogDensityMultiplier: 1.55 + step * 0.2,
      fogDarkness: 0.28 + step * 0.08,
      nightTintStrength: 0.36 + step * 0.08,
      shadowStrength: 0.32 + step * 0.08
    });
  }

  return applyBloodMoon({
    night: currentNight,
    tier: "elite",
    monsterCount: Math.min(28, 18 + Math.floor(lateNight * 0.9)),
    monsterSpeedMultiplier: Math.min(1.72, 1.42 + lateNight * 0.025),
    monsterHealth: Math.min(300, 210 + lateNight * 8),
    spawnIntervalSeconds: Math.max(1.15, 1.8 - lateNight * 0.04),
    aggressionRange: Math.min(46, 36 + lateNight * 0.6),
    attackDamage: Math.min(28, 20 + Math.floor(lateNight * 0.7)),
    attackCooldownSeconds: Math.max(0.65, 0.82 - lateNight * 0.015),
    playerInvincibilitySeconds: Math.max(0.75, 0.95 - lateNight * 0.015),
    eliteChance: Math.min(0.45, 0.18 + lateNight * 0.025),
    eliteHealthMultiplier: Math.min(1.7, 1.35 + lateNight * 0.02),
    eliteSpeedMultiplier: Math.min(1.28, 1.12 + lateNight * 0.01),
    eliteDamageMultiplier: Math.min(1.45, 1.22 + lateNight * 0.015),
    darknessIntensity: Math.min(0.78, 0.42 + (cappedNight - 10) * 0.025),
    fogDensityMultiplier: Math.min(3.4, 2.2 + lateNight * 0.08),
    fogDarkness: Math.min(0.82, 0.55 + lateNight * 0.025),
    nightTintStrength: Math.min(0.9, 0.62 + lateNight * 0.02),
    shadowStrength: Math.min(0.9, 0.58 + lateNight * 0.02)
  });
}
