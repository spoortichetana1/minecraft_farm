export function createHealth(maxValue) {
  return {
    maxValue,
    currentHealth: maxValue,
    damageCooldown: 0,
    update(deltaTime) {
      this.damageCooldown = Math.max(0, this.damageCooldown - deltaTime);
    },
    damage(amount) {
      if (this.damageCooldown > 0) return false;

      this.currentHealth = Math.max(0, this.currentHealth - amount);
      this.damageCooldown = 0.8;
      return true;
    },
    reset() {
      this.currentHealth = this.maxValue;
      this.damageCooldown = 0;
    }
  };
}
