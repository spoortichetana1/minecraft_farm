export function createHealth(maxValue) {
  return {
    maxHealth: maxValue,
    maxValue,
    currentHealth: maxValue,
    invincibilitySeconds: 1.2,
    damageCooldown: 0,
    update(deltaTime) {
      this.damageCooldown = Math.max(0, this.damageCooldown - deltaTime);
    },
    damage(amount) {
      if (this.damageCooldown > 0) return false;

      this.currentHealth = Math.max(0, this.currentHealth - amount);
      this.damageCooldown = this.invincibilitySeconds;
      return true;
    },
    heal(amount) {
      if (amount <= 0 || this.currentHealth >= this.maxValue) return false;

      this.currentHealth = Math.min(this.maxValue, this.currentHealth + amount);
      return true;
    },
    isInvincible() {
      return this.damageCooldown > 0;
    },
    reset() {
      this.currentHealth = this.maxValue;
      this.damageCooldown = 0;
    }
  };
}
